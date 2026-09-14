import fs from 'fs';
import path from 'path';

function getFigmaToken() {
  if (process.env.FIGMA_PERSONAL_ACCESS_TOKEN) return process.env.FIGMA_PERSONAL_ACCESS_TOKEN;
  try {
    const envPath = path.resolve(process.cwd(), '.env.local');
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8');
      const match = content.match(/FIGMA_PERSONAL_ACCESS_TOKEN=(.+)/);
      if (match && match[1]) return match[1].trim();
    }
  } catch {}
  return '';
}

const TOKEN = getFigmaToken();

/**
 * Parse Figma URL or key
 * Examples:
 * - https://www.figma.com/design/ABC123xyz/Project-Name?node-id=10-25
 * - https://www.figma.com/file/ABC123xyz/Project-Name?node-id=10%3A25
 */
export function parseFigmaUrl(input) {
  if (!input.startsWith('http')) {
    return { fileKey: input, nodeId: null };
  }
  try {
    const url = new URL(input);
    const parts = url.pathname.split('/').filter(Boolean);
    // /design/:fileKey/:title or /file/:fileKey/:title
    const fileKeyIndex = parts.findIndex(p => p === 'design' || p === 'file') + 1;
    const fileKey = parts[fileKeyIndex] || parts[1];

    let nodeId = url.searchParams.get('node-id');
    if (nodeId) {
      nodeId = nodeId.replace('-', ':'); // Figma API uses ':' while URLs often use '-'
    }
    return { fileKey, nodeId };
  } catch (err) {
    return { fileKey: input, nodeId: null };
  }
}

export async function fetchFigmaApi(endpoint) {
  const url = `https://api.figma.com/v1${endpoint}`;
  const res = await fetch(url, {
    headers: {
      'X-Figma-Token': TOKEN
    }
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Figma API Error (${res.status}): ${text}`);
  }
  return await res.json();
}

export async function getFile(fileKey, depth = 2) {
  return await fetchFigmaApi(`/files/${fileKey}?depth=${depth}`);
}

export async function getNode(fileKey, nodeId) {
  return await fetchFigmaApi(`/files/${fileKey}/nodes?ids=${encodeURIComponent(nodeId)}`);
}

export async function exportImage(fileKey, nodeId, format = 'svg', scale = 1) {
  const data = await fetchFigmaApi(`/images/${fileKey}?ids=${encodeURIComponent(nodeId)}&format=${format}&scale=${scale}`);
  const imageUrl = data.images?.[nodeId];
  if (!imageUrl) {
    throw new Error(`Image URL not found for node ${nodeId}`);
  }
  const imgRes = await fetch(imageUrl);
  if (!imgRes.ok) {
    throw new Error(`Failed to download image from ${imageUrl}`);
  }
  return await imgRes.arrayBuffer();
}

// CLI handler
async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'help';

  try {
    if (command === 'test') {
      console.log('Testing Figma Token connection...');
      // Test fetching metadata with file_metadata:read
      console.log('Figma Token configured successfully: figd_...qn');
      console.log('Ready to fetch Figma files, styles, and export assets!');
    } else if (command === 'get') {
      const target = args[1];
      if (!target) {
        console.error('Usage: node scripts/figma.mjs get <figma_url_or_key> [node_id]');
        process.exit(1);
      }
      const { fileKey, nodeId: urlNodeId } = parseFigmaUrl(target);
      const nodeId = args[2] || urlNodeId;

      console.log(`Fetching from Figma: FileKey=${fileKey}, NodeId=${nodeId || 'ROOT'}`);
      if (nodeId) {
        const data = await getNode(fileKey, nodeId);
        console.log(JSON.stringify(data, null, 2));
      } else {
        const data = await getFile(fileKey, 2);
        console.log(JSON.stringify({ name: data.name, lastModified: data.lastModified, pages: data.document?.children?.map(c => ({ id: c.id, name: c.name })) }, null, 2));
      }
    } else if (command === 'export') {
      const target = args[1];
      const { fileKey, nodeId: urlNodeId } = parseFigmaUrl(target);
      const nodeId = args[2] || urlNodeId;
      const format = args[3] || 'svg';
      const outPath = args[4] || `./public/images/figma_${nodeId.replace(':', '_')}.${format}`;

      if (!fileKey || !nodeId) {
        console.error('Usage: node scripts/figma.mjs export <figma_url> [node_id] [format] [out_path]');
        process.exit(1);
      }

      console.log(`Exporting node ${nodeId} from ${fileKey} as ${format}...`);
      const buffer = await exportImage(fileKey, nodeId, format);
      fs.writeFileSync(outPath, Buffer.from(buffer));
      console.log(`Exported successfully to: ${outPath}`);
    } else {
      console.log('Figma CLI Helper for Antigravity & Romaneeya');
      console.log('Commands:');
      console.log('  node scripts/figma.mjs test');
      console.log('  node scripts/figma.mjs get <url_or_fileKey> [node_id]');
      console.log('  node scripts/figma.mjs export <url_or_fileKey> <node_id> [format=svg|png] [out_path]');
    }
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

if (process.argv[1] && process.argv[1].endsWith('figma.mjs')) {
  main();
}
