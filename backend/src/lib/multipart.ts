import { IncomingMessage } from 'http';

export interface MultipartFile {
  fieldName: string;
  filename: string;
  mimeType: string;
  buffer: Buffer;
}

export interface MultipartFormData {
  fields: Record<string, string>;
  files: MultipartFile[];
}

function extractBoundary(contentType: string | undefined): string | undefined {
  if (!contentType) return undefined;
  const match = contentType.match(/boundary=(?:(?:"([^"]+)")|([^;]+))/i);
  return match?.[1] || match?.[2];
}

function parseDisposition(header: string | undefined): Record<string, string> {
  const output: Record<string, string> = {};
  if (!header) return output;
  for (const part of header.split(';')) {
    const [rawKey, ...rawValue] = part.trim().split('=');
    if (!rawKey || rawValue.length === 0) continue;
    output[rawKey.toLowerCase()] = rawValue.join('=').trim().replace(/^"|"$/g, '');
  }
  return output;
}

function parseHeaders(rawHeaders: string): Record<string, string> {
  return rawHeaders.split('\r\n').reduce<Record<string, string>>((acc, line) => {
    const index = line.indexOf(':');
    if (index === -1) return acc;
    acc[line.slice(0, index).trim().toLowerCase()] = line.slice(index + 1).trim();
    return acc;
  }, {});
}

export async function parseMultipartForm(req: IncomingMessage, maxBytes = 10 * 1024 * 1024): Promise<MultipartFormData> {
  const boundary = extractBoundary(req.headers['content-type']);
  if (!boundary) throw new Error('Invalid multipart request: missing boundary');

  const chunks: Buffer[] = [];
  let total = 0;

  for await (const chunk of req) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    total += buffer.length;
    if (total > maxBytes) throw new Error('Multipart payload too large');
    chunks.push(buffer);
  }

  const body = Buffer.concat(chunks).toString('latin1');
  const marker = `--${boundary}`;
  const fields: Record<string, string> = {};
  const files: MultipartFile[] = [];

  for (const rawPart of body.split(marker)) {
    const trimmedPart = rawPart.replace(/^\r\n/, '').replace(/\r\n$/, '');
    if (!trimmedPart || trimmedPart === '--') continue;

    const separatorIndex = trimmedPart.indexOf('\r\n\r\n');
    if (separatorIndex === -1) continue;

    const rawHeaders = trimmedPart.slice(0, separatorIndex);
    let rawContent = trimmedPart.slice(separatorIndex + 4);
    rawContent = rawContent.replace(/\r\n--$/, '').replace(/\r\n$/, '');

    const headers = parseHeaders(rawHeaders);
    const disposition = parseDisposition(headers['content-disposition']);
    const name = disposition.name;
    if (!name) continue;

    const contentBuffer = Buffer.from(rawContent, 'latin1');
    if (disposition.filename !== undefined) {
      files.push({
        fieldName: name,
        filename: disposition.filename || 'audio.webm',
        mimeType: headers['content-type'] || 'application/octet-stream',
        buffer: contentBuffer,
      });
    } else {
      fields[name] = contentBuffer.toString('utf8');
    }
  }

  return { fields, files };
}
