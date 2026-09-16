import { GeoProjectData } from '../types/geometry';

// Tabla CRC32 para cálculo rápido de sumas de comprobación según estándar PNG (IEEE 802.3)
const makeCRCTable = (): Uint32Array => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[n] = c >>> 0;
  }
  return table;
};

const CRC_TABLE = makeCRCTable();

/**
 * Calcula el CRC32 de un búfer de bytes
 */
export function crc32(bytes: Uint8Array): number {
  let crc = 0 ^ (-1);
  for (let i = 0; i < bytes.length; i++) {
    crc = (crc >>> 8) ^ CRC_TABLE[(crc ^ bytes[i]) & 0xFF];
  }
  return (crc ^ (-1)) >>> 0;
}

function uint32ToBytes(num: number): Uint8Array {
  return new Uint8Array([
    (num >>> 24) & 0xff,
    (num >>> 16) & 0xff,
    (num >>> 8) & 0xff,
    num & 0xff
  ]);
}

function bytesToUint32(bytes: Uint8Array, offset: number): number {
  return (
    ((bytes[offset] << 24) |
      (bytes[offset + 1] << 16) |
      (bytes[offset + 2] << 8) |
      bytes[offset + 3]) >>>
    0
  );
}

/**
 * Inserta un fragmento de metadatos 'tEXt' conforme al estándar PNG
 * inmediatamente después del encabezado IHDR.
 * La imagen resultante es un PNG 100% válido y visualizable en cualquier visor,
 * pero contiene los datos completos del proyecto para reanudar el trabajo.
 */
export async function embedProjectInPNG(pngBlob: Blob, projectData: GeoProjectData): Promise<Blob> {
  const arrayBuffer = await pngBlob.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);

  // Firma oficial de 8 bytes de un archivo PNG
  const pngSignature = [137, 80, 78, 71, 13, 10, 26, 10];
  const isPng = pngSignature.every((val, idx) => bytes[idx] === val);
  if (!isPng) {
    return pngBlob;
  }

  // Serializar datos del proyecto y convertirlos a Base64
  const jsonStr = JSON.stringify(projectData);
  const jsonBytes = new TextEncoder().encode(jsonStr);

  let binary = '';
  for (let i = 0; i < jsonBytes.byteLength; i++) {
    binary += String.fromCharCode(jsonBytes[i]);
  }
  const base64Data = btoa(binary);

  // Estructura de tEXt chunk: Keyword + 0x00 (separador) + Payload
  const keyword = 'GeoTransform';
  const keywordBytes = new TextEncoder().encode(keyword);
  const payloadBytes = new TextEncoder().encode(base64Data);

  const chunkData = new Uint8Array(keywordBytes.length + 1 + payloadBytes.length);
  chunkData.set(keywordBytes, 0);
  chunkData[keywordBytes.length] = 0; // Byte nulo delimitador
  chunkData.set(payloadBytes, keywordBytes.length + 1);

  // Tipo de chunk: 'tEXt'
  const chunkType = new Uint8Array([0x74, 0x45, 0x58, 0x74]); // 't', 'E', 'X', 't'

  // CRC32 sobre Type + Data
  const typeAndData = new Uint8Array(chunkType.length + chunkData.length);
  typeAndData.set(chunkType, 0);
  typeAndData.set(chunkData, chunkType.length);
  const crcVal = crc32(typeAndData);

  // Empaquetar chunk completo: Length (4) + Type (4) + Data (N) + CRC (4)
  const chunkLengthBytes = uint32ToBytes(chunkData.length);
  const crcBytes = uint32ToBytes(crcVal);

  const fullChunk = new Uint8Array(4 + 4 + chunkData.length + 4);
  fullChunk.set(chunkLengthBytes, 0);
  fullChunk.set(chunkType, 4);
  fullChunk.set(chunkData, 8);
  fullChunk.set(crcBytes, 8 + chunkData.length);

  // En PNG, IHDR inicia en byte 8 y termina en byte 33 (8 de firma + 4 len + 4 'IHDR' + 13 data + 4 crc = 33)
  const insertOffset = 33;
  const resultBytes = new Uint8Array(bytes.length + fullChunk.length);
  resultBytes.set(bytes.subarray(0, insertOffset), 0);
  resultBytes.set(fullChunk, insertOffset);
  resultBytes.set(bytes.subarray(insertOffset), insertOffset + fullChunk.length);

  return new Blob([resultBytes], { type: 'image/png' });
}

/**
 * Extrae y reconstituye los datos de proyecto desde un archivo subido:
 * - Soporta imágenes PNG con 'tEXt' chunks ('GeoTransform' o 'GeoTransformProject').
 * - Soporta archivos de respaldo JSON directos (.geot / .json).
 */
export async function extractProjectFromPNG(file: File | Blob): Promise<GeoProjectData | null> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);

    // 1. Verificar si es un archivo de texto JSON / .geot directo
    try {
      const textDecoder = new TextDecoder('utf-8');
      const text = textDecoder.decode(bytes);
      if (text.trim().startsWith('{')) {
        const parsed = JSON.parse(text);
        if (parsed && (parsed.vertices || parsed.config)) {
          return parsed as GeoProjectData;
        }
      }
    } catch {
      // Continuar con análisis binario PNG
    }

    // 2. Verificar firma PNG
    const pngSignature = [137, 80, 78, 71, 13, 10, 26, 10];
    const isPng = pngSignature.every((val, idx) => bytes[idx] === val);
    if (!isPng) return null;

    // 3. Recorrer chunks de PNG
    let offset = 8;
    while (offset + 8 <= bytes.length) {
      const length = bytesToUint32(bytes, offset);
      const typeChars = String.fromCharCode(
        bytes[offset + 4],
        bytes[offset + 5],
        bytes[offset + 6],
        bytes[offset + 7]
      );

      if (typeChars === 'tEXt') {
        const chunkData = bytes.subarray(offset + 8, offset + 8 + length);
        let nullIdx = -1;
        for (let i = 0; i < chunkData.length; i++) {
          if (chunkData[i] === 0) {
            nullIdx = i;
            break;
          }
        }

        if (nullIdx !== -1) {
          const keyword = String.fromCharCode(...chunkData.subarray(0, nullIdx));
          if (keyword === 'GeoTransform' || keyword === 'GeoTransformProject') {
            const payloadBytes = chunkData.subarray(nullIdx + 1);
            let base64Str = '';
            for (let i = 0; i < payloadBytes.length; i++) {
              base64Str += String.fromCharCode(payloadBytes[i]);
            }

            const binary = atob(base64Str);
            const decodedBytes = new Uint8Array(binary.length);
            for (let i = 0; i < binary.length; i++) {
              decodedBytes[i] = binary.charCodeAt(i);
            }
            const jsonStr = new TextDecoder('utf-8').decode(decodedBytes);
            const project = JSON.parse(jsonStr) as GeoProjectData;
            return project;
          }
        }
      }

      // Avanzar al siguiente chunk (Length + Type + Data + CRC)
      offset += 8 + length + 4;
    }

    return null;
  } catch (err) {
    console.error('Error al extraer datos de proyecto:', err);
    return null;
  }
}
