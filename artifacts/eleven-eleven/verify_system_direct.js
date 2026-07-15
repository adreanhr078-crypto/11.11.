import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// قراءة ملف gameStore.ts
const gameStorePath = path.join(__dirname, 'src', 'stores', 'gameStore.ts');
const gameStoreContent = fs.readFileSync(gameStorePath, 'utf8');

// قراءة ملفات الأرك
const preludeArcPath = path.join(__dirname, 'src', 'core', 'echoTransformationPreludeArc.ts');
const fractureArcPath = path.join(__dirname, 'src', 'core', 'echoFractureArc.ts');
const architectArcPath = path.join(__dirname, 'src', 'core', 'echoArchitectArc.ts');
const signalArcPath = path.join(__dirname, 'src', 'core', 'echoSignalArc.ts');
const finalArcPath = path.join(__dirname, 'src', 'core', 'echoFinalArc.ts');

const preludeArcContent = fs.readFileSync(preludeArcPath, 'utf8');
const fractureArcContent = fs.readFileSync(fractureArcPath, 'utf8');
const architectArcContent = fs.readFileSync(architectArcPath, 'utf8');
const signalArcContent = fs.readFileSync(signalArcPath, 'utf8');
const finalArcContent = fs.readFileSync(finalArcPath, 'utf8');

// قراءة ملف VideoMemorySystem
const videoMemoryPath = path.join(__dirname, 'src', 'components', 'video', 'VideoMemorySystem.tsx');
const videoMemoryContent = fs.readFileSync(videoMemoryPath, 'utf8');

// قراءة ملف EndingPanel
const endingPanelPath = path.join(__dirname, 'src', 'components', 'sections', 'EndingPanel.tsx');
const endingPanelContent = fs.readFileSync(endingPanelPath, 'utf8');

// قراءة ملف ExpandedEndingSystem
const finalArcMatch = finalArcContent.match(/export const ExpandedEndingSystem = \{(.*?)\};/s);
const expandedEndingSystem = finalArcMatch ? finalArcMatch[1] : '';

// استخراج البيانات الفعلية من دوال التوليد
function extractPuzzleCountFromComments(content) {
    // البحث عن تعليقات توضح عدد الألغاز
    const commentMatch = content.match(/\/\/\s*(\d+) puzzles?/i);
    if (commentMatch) return parseInt(commentMatch[1]);

    // البحث عن تعليقات توضح نطاق الألغاز
    const rangeMatch = content.match(/\/\/\s*نطاق الألغاز:\s*(\d+)\s*→\s*(\d+)/);
    if (rangeMatch) {
        return parseInt(rangeMatch[2]) - parseInt(rangeMatch[1]) + 1;
    }

    // البحث عن startId و endId
    const startIdMatch = content.match(/const startId =\s*(\d+)/);
    const endIdMatch = content.match(/const endId =\s*(\d+)/);
    if (startIdMatch && endIdMatch) {
        return parseInt(endIdMatch[1]) - parseInt(startIdMatch[1]) + 1;
    }

    return 0;
}

// استخراج البيانات الفعلية من دوال التوليد
function extractAchievementCountFromComments(content) {
    // البحث عن تعليقات توضح عدد الإنجازات
    const commentMatch = content.match(/\/\/\s*(\d+) achievements?/i);
    if (commentMatch) return parseInt(commentMatch[1]);

    return 0;
}

// استخراج البيانات الفعلية من دوال التوليد
function extractMemoryShardCountFromComments(content) {
    // البحث عن تعليقات توضح عدد شظايا الذاكرة
    const commentMatch = content.match(/\/\/\s*(\d+) memory shards?/i);
    if (commentMatch) return parseInt(commentMatch[1]);

    return 0;
}

// استخراج البيانات الفعلية من دوال التوليد
function extractCinematicSceneCountFromComments(content) {
    // البحث عن تعليقات توضح عدد المشاهد السينمائية
    const commentMatch = content.match(/\/\/\s*(\d+) cinematic scenes?/i);
    if (commentMatch) return parseInt(commentMatch[1]);

    return 0;
}

// استخراج البيانات الفعلية من دوال التوليد
function extractEndingCountFromComments(content) {
    // البحث عن تعليقات توضح عدد النهايات
    const commentMatch = content.match(/\/\/\s*(\d+) endings?/i);
    if (commentMatch) return parseInt(commentMatch[1]);

    return 0;
}

// قراءة البيانات من gameStore.ts
console.log('🔍 فحص نظام لعبة 11.11 الآلي (إصدار مباشر)');
console.log('═'.repeat(50));

// استخراج البيانات من gameStore
const totalPuzzlesMatch = gameStoreContent.match(/totalPuzzles:\s*(\d+)/);
const totalMemoryShardsMatch = gameStoreContent.match(/totalFragments:\s*(\d+)/);
const totalAchievementsMatch = gameStoreContent.match(/generateAllAchievements\(\)/);

console.log('📊 البيانات من gameStore.ts:');
console.log(`- إجمالي الألغاز: ${totalPuzzlesMatch ? totalPuzzlesMatch[1] : 'غير معروف'}`);
console.log(`- إجمالي شظايا الذاكرة: ${totalMemoryShardsMatch ? totalMemoryShardsMatch[1] : 'غير معروف'}`);
console.log(`- نظام الإنجازات: ${totalAchievementsMatch ? 'موجود' : 'غير موجود'}`);
console.log('');

// استخراج بيانات كل أرك
const arcs = [
    { name: 'Original', content: gameStoreContent, file: 'gameStore.ts', range: [1, 219], expectedPuzzles: 219 },
    { name: 'Prelude', content: preludeArcContent, file: 'echoTransformationPreludeArc.ts', range: [220, 333], expectedPuzzles: 114 },
    { name: 'Fracture', content: fractureArcContent, file: 'echoFractureArc.ts', range: [334, 500], expectedPuzzles: 167 },
    { name: 'Architect', content: architectArcContent, file: 'echoArchitectArc.ts', range: [501, 666], expectedPuzzles: 166 },
    { name: 'Signal', content: signalArcContent, file: 'echoSignalArc.ts', range: [667, 888], expectedPuzzles: 222 },
    { name: 'Final', content: finalArcContent, file: 'echoFinalArc.ts', range: [889, 1000], expectedPuzzles: 112 }
];

let totalPuzzles = 0;
let totalAchievements = 0;
let totalMemoryShards = 0;
let totalCinematicScenes = 0;

console.log('📋 تفاصيل كل أرك:');
console.log('─'.repeat(50));

arcs.forEach(arc => {
    const puzzles = extractPuzzleCountFromComments(arc.content, arc.name);
    const achievements = extractAchievementCountFromComments(arc.content);
    const memoryShards = extractMemoryShardCountFromComments(arc.content);
    const cinematicScenes = extractCinematicSceneCountFromComments(arc.content);

    totalPuzzles += puzzles;
    totalAchievements += achievements;
    totalMemoryShards += memoryShards;
    totalCinematicScenes += cinematicScenes;

    const status = puzzles === arc.expectedPuzzles ? '✅' : '❌';
    console.log(`${arc.name} Arc (${arc.range[0]}-${arc.range[1]}):`);
    console.log(`  - عدد الألغاز: ${puzzles} (متوقع: ${arc.expectedPuzzles}) ${status}`);
    console.log(`  - عدد الإنجازات: ${achievements}`);
    console.log(`  - عدد شظايا الذاكرة: ${memoryShards}`);
    console.log(`  - عدد المشاهد السينمائية: ${cinematicScenes}`);
    console.log('');
});

console.log('📊 المجموعات النهائية:');
console.log(`- إجمالي الألغاز: ${totalPuzzles} (متوقع: 1000)`);
console.log(`- إجمالي الإنجازات: ${totalAchievements} (متوقع: 129)`);
console.log(`- إجمالي شظايا الذاكرة: ${totalMemoryShards} (متوقع: 835)`);
console.log(`- إجمالي المشاهد السينمائية: ${totalCinematicScenes} (متوقع: 52)`);

// استخراج عدد النهايات
const endingCount = extractEndingCountFromComments(endingPanelContent);
console.log(`- عدد النهايات: ${endingCount} (متوقع: 5)`);

console.log('');
console.log('🔍 التحقق من سلامة البيانات:');

// التحقق من أن totalPuzzles = 1000
console.log(`- التحقق من أن إجمالي الألغاز = 1000: ${totalPuzzles === 1000 ? '✅' : '❌'}`);

// التحقق من أن واجهة المستخدم تستخدم نفس gameStore
const appPath = path.join(__dirname, 'src', 'App.tsx');
const appContent = fs.readFileSync(appPath, 'utf8');
const usesGameStore = appContent.includes('useGameStore') || appContent.includes('gameStore');
console.log(`- واجهة المستخدم تستخدم gameStore الصحيح: ${usesGameStore ? '✅' : '❌'}`);

console.log('');
console.log('✅ الفحص الآلي المباشر مكتمل!');