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

// استخراج عدد الألغاز من كل أرك
function extractPuzzleCount(content, arcName) {
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

// استخراج عدد الإنجازات من كل أرك
function extractAchievementCount(content) {
    const achievementGenMatch = content.match(/generate\w+ArcAchievements\(\): Achievement\[\] \{\s*return (\[.*?\]|generate\w+Achievements\(.*?\))/s);
    if (!achievementGenMatch) return 0;

    // البحث عن عدد الإنجازات مباشرة
    const countMatch = content.match(/(\d+) achievements?/i);
    if (countMatch) return parseInt(countMatch[1]);

    // إذا لم نجد مباشرة، نبحث عن عدد العناصر في المصفوفة
    const arrayMatch = content.match(/\[(.*?)\]/s);
    if (arrayMatch) {
        const items = arrayMatch[1].split(',').filter(item => item.trim());
        return items.length;
    }

    return 0;
}

// استخراج عدد شظايا الذاكرة من كل أرك
function extractMemoryShardCount(content) {
    const memoryGenMatch = content.match(/generate\w+ArcMemoryShards\(\): MemoryShard\[\] \{\s*return (\[.*?\]|generate\w+MemoryShards\(.*?\))/s);
    if (!memoryGenMatch) return 0;

    // البحث عن عدد شظايا الذاكرة مباشرة
    const countMatch = content.match(/totalFragments:\s*(\d+)/);
    if (countMatch) return parseInt(countMatch[1]);

    return 0;
}

// استخراج عدد المشاهد السينمائية
function extractCinematicSceneCount(content) {
    const cinematicGenMatch = content.match(/generate\w+ArcCinematicScenes\(\): CinematicScene\[\] \{\s*return (\[.*?\]|generate\w+CinematicScenes\(.*?\))/s);
    if (!cinematicGenMatch) return 0;

    // البحث عن عدد المشاهد مباشرة
    const countMatch = content.match(/(\d+) cinematic scenes?/i);
    if (countMatch) return parseInt(countMatch[1]);

    // إذا لم نجد مباشرة، نبحث عن عدد العناصر في المصفوفة
    const arrayMatch = content.match(/\[(.*?)\]/s);
    if (arrayMatch) {
        const items = arrayMatch[1].split(',').filter(item => item.trim());
        return items.length;
    }

    return 0;
}

// استخراج عدد النهايات
function extractEndingCount(content) {
    const endingMatch = content.match(/endings:\s*\[(.*?)\]/s);
    if (endingMatch) {
        const endings = endingMatch[1].split(',').filter(item => item.trim());
        return endings.length;
    }

    // البحث عن عدد النهايات في ExpandedEndingSystem
    const expandedEndings = expandedEndingSystem.match(/endings:\s*\[(.*?)\]/s);
    if (expandedEndings) {
        const endings = expandedEndings[1].split(',').filter(item => item.trim());
        return endings.length;
    }

    return 0;
}

// استخراج أول وآخر ID لكل أرك
function extractPuzzleIDs(content) {
    const firstIdMatch = content.match(/id:\s*['"]([^'"]+)['"]/);
    const lastIdMatch = content.match(/id:\s*['"]([^'"]+)['"]/g);

    return {
        firstId: firstIdMatch ? firstIdMatch[1] : 'unknown',
        lastId: lastIdMatch && lastIdMatch.length > 0 ? lastIdMatch[lastIdMatch.length - 1].replace(/id:\s*['"]/, '').replace(/['"]/, '') : 'unknown'
    };
}

// التحقق من وجود أرقام ناقصة
function checkMissingNumbers(puzzles) {
    const puzzleNumbers = puzzles.map(p => {
        const idMatch = p.id.match(/(\d+)/);
        return idMatch ? parseInt(idMatch[1]) : 0;
    }).filter(n => n > 0);

    const missingNumbers = [];
    for (let i = 1; i <= 1000; i++) {
        if (!puzzleNumbers.includes(i)) {
            missingNumbers.push(i);
        }
    }

    return missingNumbers;
}

// التحقق من وجود IDs مكررة
function checkDuplicateIDs(puzzles) {
    const idCounts = {};
    puzzles.forEach(p => {
        idCounts[p.id] = (idCounts[p.id] || 0) + 1;
    });

    const duplicates = Object.keys(idCounts).filter(id => idCounts[id] > 1);
    return duplicates;
}

// قراءة البيانات من gameStore.ts
console.log('🔍 فحص نظام لعبة 11.11 الآلي');
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
    { name: 'Original', content: gameStoreContent, file: 'gameStore.ts' },
    { name: 'Prelude', content: preludeArcContent, file: 'echoTransformationPreludeArc.ts' },
    { name: 'Fracture', content: fractureArcContent, file: 'echoFractureArc.ts' },
    { name: 'Architect', content: architectArcContent, file: 'echoArchitectArc.ts' },
    { name: 'Signal', content: signalArcContent, file: 'echoSignalArc.ts' },
    { name: 'Final', content: finalArcContent, file: 'echoFinalArc.ts' }
];

let totalPuzzles = 0;
let totalAchievements = 0;
let totalMemoryShards = 0;
let totalCinematicScenes = 0;

console.log('📋 تفاصيل كل أرك:');
console.log('─'.repeat(50));

arcs.forEach(arc => {
    const puzzles = extractPuzzleCount(arc.content, arc.name);
    const achievements = extractAchievementCount(arc.content);
    const memoryShards = extractMemoryShardCount(arc.content);
    const cinematicScenes = extractCinematicSceneCount(arc.content);
    const ids = extractPuzzleIDs(arc.content);

    totalPuzzles += puzzles;
    totalAchievements += achievements;
    totalMemoryShards += memoryShards;
    totalCinematicScenes += cinematicScenes;

    console.log(`${arc.name} Arc:`);
    console.log(`  - عدد الألغاز: ${puzzles}`);
    console.log(`  - أول ID: ${ids.firstId}`);
    console.log(`  - آخر ID: ${ids.lastId}`);
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
const endingCount = extractEndingCount(endingPanelContent);
console.log(`- عدد النهايات: ${endingCount}`);

// التحقق من وجود أرقام ناقصة
console.log('');
console.log('🔍 التحقق من سلامة البيانات:');

// محاكاة توليد الألغاز للتحقق من الأرقام
const puzzleIds = [];
arcs.forEach(arc => {
    const idMatches = arc.content.matchAll(/id:\s*['"]([^'"]+)['"]/g);
    for (const match of idMatches) {
        puzzleIds.push(match[1]);
    }
});

const puzzleNumbers = puzzleIds.map(id => {
    const numMatch = id.match(/(\d+)/);
    return numMatch ? parseInt(numMatch[1]) : 0;
}).filter(n => n > 0);

const missingNumbers = [];
for (let i = 1; i <= 1000; i++) {
    if (!puzzleNumbers.includes(i)) {
        missingNumbers.push(i);
    }
}

const idCounts = {};
puzzleIds.forEach(id => {
    idCounts[id] = (idCounts[id] || 0) + 1;
});

const duplicateIds = Object.keys(idCounts).filter(id => idCounts[id] > 1);

console.log(`- أرقام ناقصة: ${missingNumbers.length > 0 ? missingNumbers.join(', ') : 'لا يوجد'}`);
console.log(`- IDs مكررة: ${duplicateIds.length > 0 ? duplicateIds.join(', ') : 'لا يوجد'}`);

// التحقق من أن totalPuzzles = 1000
console.log(`- التحقق من أن إجمالي الألغاز = 1000: ${totalPuzzles === 1000 ? '✅' : '❌'}`);

// التحقق من أن واجهة المستخدم تستخدم نفس gameStore
const appPath = path.join(__dirname, 'src', 'App.tsx');
const appContent = fs.readFileSync(appPath, 'utf8');
const usesGameStore = appContent.includes('useGameStore') || appContent.includes('gameStore');
console.log(`- واجهة المستخدم تستخدم gameStore الصحيح: ${usesGameStore ? '✅' : '❌'}`);

console.log('');
console.log('✅ الفحص الآلي مكتمل!');