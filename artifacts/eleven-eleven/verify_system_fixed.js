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
function extractActualPuzzleCount(content) {
    // البحث عن نطاق الألغاز مباشرة
    const rangeMatch = content.match(/نطاق الألغاز:\s*(\d+)\s*→\s*(\d+)/);
    if (rangeMatch) {
        return parseInt(rangeMatch[2]) - parseInt(rangeMatch[1]) + 1;
    }

    // البحث عن startId و endId
    const startIdMatch = content.match(/const startId =\s*(\d+)/);
    const endIdMatch = content.match(/const endId =\s*(\d+)/);
    if (startIdMatch && endIdMatch) {
        return parseInt(endIdMatch[1]) - parseInt(startIdMatch[1]) + 1;
    }

    // البحث عن عدد الألغاز مباشرة
    const countMatch = content.match(/totalPuzzles:\s*(\d+)/);
    if (countMatch) return parseInt(countMatch[1]);

    return 0;
}

// استخراج البيانات الفعلية من دوال التوليد
function extractActualAchievementCount(content) {
    // البحث عن عدد الإنجازات مباشرة
    const countMatch = content.match(/(\d+) achievements?/i);
    if (countMatch) return parseInt(countMatch[1]);

    // البحث عن عدد الإنجازات في التعليقات
    const commentMatch = content.match(/\/\/\s*(\d+) achievements?/i);
    if (commentMatch) return parseInt(commentMatch[1]);

    return 0;
}

// استخراج البيانات الفعلية من دوال التوليد
function extractActualMemoryShardCount(content) {
    // البحث عن عدد شظايا الذاكرة مباشرة
    const countMatch = content.match(/totalFragments:\s*(\d+)/);
    if (countMatch) return parseInt(countMatch[1]);

    // البحث عن عدد شظايا الذاكرة في التعليقات
    const commentMatch = content.match(/\/\/\s*(\d+) memory shards?/i);
    if (commentMatch) return parseInt(commentMatch[1]);

    return 0;
}

// استخراج البيانات الفعلية من دوال التوليد
function extractActualCinematicSceneCount(content) {
    // البحث عن عدد المشاهد السينمائية مباشرة
    const countMatch = content.match(/(\d+) cinematic scenes?/i);
    if (countMatch) return parseInt(countMatch[1]);

    // البحث عن عدد المشاهد السينمائية في التعليقات
    const commentMatch = content.match(/\/\/\s*(\d+) cinematic scenes?/i);
    if (commentMatch) return parseInt(commentMatch[1]);

    return 0;
}

// استخراج البيانات الفعلية من دوال التوليد
function extractActualEndingCount(content) {
    // البحث عن عدد النهايات في ExpandedEndingSystem
    const expandedEndings = expandedEndingSystem.match(/endings:\s*\[(.*?)\]/s);
    if (expandedEndings) {
        const endings = expandedEndings[1].split(',').filter(item => item.trim());
        return endings.length;
    }

    // البحث عن عدد النهايات في التعليقات
    const commentMatch = content.match(/\/\/\s*(\d+) endings?/i);
    if (commentMatch) return parseInt(commentMatch[1]);

    return 0;
}

// قراءة البيانات من gameStore.ts
console.log('🔍 فحص نظام لعبة 11.11 الآلي (إصدار محسن)');
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
    { name: 'Original', content: gameStoreContent, file: 'gameStore.ts', range: [1, 219] },
    { name: 'Prelude', content: preludeArcContent, file: 'echoTransformationPreludeArc.ts', range: [220, 333] },
    { name: 'Fracture', content: fractureArcContent, file: 'echoFractureArc.ts', range: [334, 500] },
    { name: 'Architect', content: architectArcContent, file: 'echoArchitectArc.ts', range: [501, 666] },
    { name: 'Signal', content: signalArcContent, file: 'echoSignalArc.ts', range: [667, 888] },
    { name: 'Final', content: finalArcContent, file: 'echoFinalArc.ts', range: [889, 1000] }
];

let totalPuzzles = 0;
let totalAchievements = 0;
let totalMemoryShards = 0;
let totalCinematicScenes = 0;

console.log('📋 تفاصيل كل أرك:');
console.log('─'.repeat(50));

arcs.forEach(arc => {
    const puzzles = extractActualPuzzleCount(arc.content, arc.name);
    const achievements = extractActualAchievementCount(arc.content);
    const memoryShards = extractActualMemoryShardCount(arc.content);
    const cinematicScenes = extractActualCinematicSceneCount(arc.content);

    totalPuzzles += puzzles;
    totalAchievements += achievements;
    totalMemoryShards += memoryShards;
    totalCinematicScenes += cinematicScenes;

    console.log(`${arc.name} Arc (${arc.range[0]}-${arc.range[1]}):`);
    console.log(`  - عدد الألغاز: ${puzzles}`);
    console.log(`  - عدد الإنجازات: ${achievements}`);
    console.log(`  - عدد شظايا الذاكرة: ${memoryShards}`);
    console.log(`  - عدد المشاهد السينمائية: ${cinematicScenes}`);
    console.log('');
});

console.log('📊 المجموعات النهائية:');
console.log(`- إجمالي الألغاز: ${totalPuzzles}`);
console.log(`- إجمالي الإنجازات: ${totalAchievements}`);
console.log(`- إجمالي شظايا الذاكرة: ${totalMemoryShards}`);
console.log(`- إجمالي المشاهد السينمائية: ${totalCinematicScenes}`);

// استخراج عدد النهايات
const endingCount = extractActualEndingCount(endingPanelContent);
console.log(`- عدد النهايات: ${endingCount}`);

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
console.log('✅ الفحص الآلي المحسن مكتمل!');