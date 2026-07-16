import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔍 فحص شامل لشظايا الذاكرة في نظام لعبة 11.11');
console.log('═'.repeat(60));

// استيراد الملفات اللازمة
const memoryShardsSystemPath = path.join(__dirname, 'src', 'core', 'memoryShardsSystem.ts');
const preludeArcPath = path.join(__dirname, 'src', 'core', 'echoTransformationPreludeArc.ts');
const fractureArcPath = path.join(__dirname, 'src', 'core', 'echoFractureArc.ts');
const architectArcPath = path.join(__dirname, 'src', 'core', 'echoArchitectArc.ts');
const signalArcPath = path.join(__dirname, 'src', 'core', 'echoSignalArc.ts');
const finalArcPath = path.join(__dirname, 'src', 'core', 'echoFinalArc.ts');
const gameStorePath = path.join(__dirname, 'src', 'stores', 'gameStore.ts');

console.log('📁 استيراد الملفات...');
console.log(`- ${memoryShardsSystemPath}`);
console.log(`- ${preludeArcPath}`);
console.log(`- ${fractureArcPath}`);
console.log(`- ${architectArcPath}`);
console.log(`- ${signalArcPath}`);
console.log(`- ${finalArcPath}`);
console.log(`- ${gameStorePath}`);
console.log('');

// قراءة محتوى الملفات
const memoryShardsSystemContent = fs.readFileSync(memoryShardsSystemPath, 'utf8');
const preludeArcContent = fs.readFileSync(preludeArcPath, 'utf8');
const fractureArcContent = fs.readFileSync(fractureArcPath, 'utf8');
const architectArcContent = fs.readFileSync(architectArcPath, 'utf8');
const signalArcContent = fs.readFileSync(signalArcPath, 'utf8');
const finalArcContent = fs.readFileSync(finalArcPath, 'utf8');
const gameStoreContent = fs.readFileSync(gameStorePath, 'utf8');

console.log('🔍 فحص شظايا الذاكرة...');
console.log('');

// استخراج شظايا الذاكرة من كل أرك
function extractMemoryShardsFromFile(content, arcName) {
  // البحث عن جميع دوال توليد الشظايا
  const functionMatches = [...content.matchAll(/export\s+function\s+generate\w+MemoryShards\(\):\s*(MemoryShard\[\]|string\[\])\s*\{/g)];

  if (!functionMatches || functionMatches.length === 0) {
    return 0;
  }

  // البحث عن الحلقات في كل دالة
  let count = 0;
  for (const match of functionMatches) {
    const functionStart = match.index;
    const remainingContent = content.substring(functionStart);

    // البحث عن الحلقات التي تولد الشظايا
    const loopMatch = remainingContent.match(/for\s*\(let\s+i\s*=\s*(\d+)\s*;\s*i\s*<=\s*(\d+)\s*;\s*i\+\+\)/);
    if (loopMatch) {
      const start = parseInt(loopMatch[1]);
      const end = parseInt(loopMatch[2]);
      count += (end - start + 1);
    }

    // البحث عن استخدام MEMORY_SHARDS_TIMELINE.slice()
    const sliceMatch = remainingContent.match(/MEMORY_SHARDS_TIMELINE\.slice\(\s*(\d+)\s*,\s*(\d+)\s*\)/);
    if (sliceMatch) {
      const start = parseInt(sliceMatch[1]);
      const end = parseInt(sliceMatch[2]);
      count += (end - start);
    }
  }

  return count;
}

// استخراج شظايا الذاكرة من كل أرك
const originalMemoryShards = extractMemoryShardsFromFile(memoryShardsSystemContent, 'Original');
const preludeMemoryShards = extractMemoryShardsFromFile(preludeArcContent, 'Prelude');
const fractureMemoryShards = extractMemoryShardsFromFile(fractureArcContent, 'Fracture');
const architectMemoryShards = extractMemoryShardsFromFile(architectArcContent, 'Architect');
const signalMemoryShards = extractMemoryShardsFromFile(signalArcContent, 'Signal');
const finalMemoryShards = extractMemoryShardsFromFile(finalArcContent, 'Final');

// حساب الإجمالي
const totalMemoryShards = originalMemoryShards + preludeMemoryShards + fractureMemoryShards +
                         architectMemoryShards + signalMemoryShards + finalMemoryShards;

console.log('📊 Memory Shards Final Verification:');
console.log(`- Original memory shards count: ${originalMemoryShards}`);
console.log(`- Prelude memory shards count: ${preludeMemoryShards}`);
console.log(`- Fracture memory shards count: ${fractureMemoryShards}`);
console.log(`- Architect memory shards count: ${architectMemoryShards}`);
console.log(`- Signal memory shards count: ${signalMemoryShards}`);
console.log(`- Final memory shards count: ${finalMemoryShards}`);
console.log(`- Total memory shards: ${totalMemoryShards} (متوقع: 835)`);
console.log('');

// التحقق من gameStore
console.log('🔍 التحقق من gameStore...');
const totalMemoryShardsMatch = gameStoreContent.match(/totalFragments:\s*(\d+)/);
const totalMemoryShardsInStore = totalMemoryShardsMatch ? parseInt(totalMemoryShardsMatch[1]) : 0;
console.log(`- totalMemoryShards in gameStore: ${totalMemoryShardsInStore}`);

// التحقق إذا كان الرقم ثابت أم محسوب dynamically
const isDynamic = gameStoreContent.includes('allMemoryShards.length') ||
                  gameStoreContent.includes('generateAllMemoryShards()') ||
                  gameStoreContent.includes('generateMemoryShards()');
console.log(`- هل totalMemoryShards رقم ثابت أم محسوب dynamically: ${isDynamic ? 'dynamically' : 'ثابت'}`);

// التحقق من وجود دوال توليد الشظايا
console.log('🔍 التحقق من وجود دوال توليد الشظايا...');
const hasGenerateOriginal = memoryShardsSystemContent.includes('generateOriginalMemoryShards()');
const hasGeneratePrelude = preludeArcContent.includes('generatePreludeMemoryShards()');
const hasGenerateFracture = fractureArcContent.includes('generateFractureMemoryShards()');
const hasGenerateArchitect = architectArcContent.includes('generateArchitectMemoryShards()');
const hasGenerateSignal = signalArcContent.includes('generateSignalMemoryShards()');
const hasGenerateFinal = finalArcContent.includes('generateFinalMemoryShards()');

console.log(`- generateOriginalMemoryShards: ${hasGenerateOriginal ? '✅' : '❌'}`);
console.log(`- generatePreludeMemoryShards: ${hasGeneratePrelude ? '✅' : '❌'}`);
console.log(`- generateFractureMemoryShards: ${hasGenerateFracture ? '✅' : '❌'}`);
console.log(`- generateArchitectMemoryShards: ${hasGenerateArchitect ? '✅' : '❌'}`);
console.log(`- generateSignalMemoryShards: ${hasGenerateSignal ? '✅' : '❌'}`);
console.log(`- generateFinalMemoryShards: ${hasGenerateFinal ? '✅' : '❌'}`);

// التحقق من الربط في gameStore
console.log('🔍 التحقق من الربط في gameStore...');
const usesAllMemoryShards = gameStoreContent.includes('allMemoryShards');
const hasMemoryShardGeneration = gameStoreContent.includes('generateAllMemoryShards') ||
                                 gameStoreContent.includes('generateMemoryShards');
console.log(`- هل gameStore يستخدم allMemoryShards: ${usesAllMemoryShards ? '✅' : '❌'}`);
console.log(`- هل gameStore يحتوي على توليد الشظايا: ${hasMemoryShardGeneration ? '✅' : '❌'}`);

console.log('');
console.log('📋 ملخص:');
console.log(`- إجمالي شظايا الذاكرة المتوقعة: 835`);
console.log(`- إجمالي شظايا الذاكرة الفعلية: ${totalMemoryShards}`);
console.log(`- مطابق للمتوقع: ${totalMemoryShards === 835 ? '✅' : '❌'}`);
console.log(`- جميع دوال التوليد موجودة: ${hasGenerateOriginal && hasGeneratePrelude && hasGenerateFracture &&
              hasGenerateArchitect && hasGenerateSignal && hasGenerateFinal ? '✅' : '❌'}`);

console.log('');
console.log('✅ الفحص الشامل لشظايا الذاكرة مكتمل!');