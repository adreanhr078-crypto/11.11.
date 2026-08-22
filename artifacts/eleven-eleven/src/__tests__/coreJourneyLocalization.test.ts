import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, it } from 'node:test';

function source(relativePath: string): string {
  return readFileSync(resolve(process.cwd(), relativePath), 'utf8');
}

describe('core journey localization', () => {
  it('keeps the first sign-in decision understandable in English without changing authentication authority', () => {
    const auth = source('src/features/auth/AuthPanel.tsx');

    assert.ok(auth.includes("const locale = useUiPreferencesStore((state) => state.locale);"));
    assert.ok(auth.includes("dir={locale === 'ar' ? 'rtl' : 'ltr'}"));
    assert.ok(auth.includes("'Welcome back'"));
    assert.ok(auth.includes('Continue with Google'));
    assert.ok(auth.includes('Continue as guest'));
    assert.ok(auth.includes('Keep this journey'));
    assert.ok(auth.includes('actions.signInWithGoogle'));
    assert.ok(auth.includes('actions.linkAnonymousAccountWithGoogle'));
  });

  it('keeps the main-menu decision and server-read objective in the selected language', () => {
    const menu = source('src/features/screens/MainMenuScreen.tsx');
    const objective = source('src/application/player-journey/corePlayerLoop.ts');
    const objectiveCard = source('src/features/player-journey/CoreObjectiveCard.tsx');
    const shell = source('src/app/shell/ApplicationShell.tsx');

    assert.ok(menu.includes('const copy = MAIN_MENU_COPY[locale];'));
    assert.ok(menu.includes("deriveCorePlayerObjective(storyPuzzleSnapshot, locale)"));
    assert.ok(menu.includes("signIn: 'Sign in and begin'"));
    assert.ok(menu.includes("identityFirst: 'Secure your identity first'"));
    assert.ok(objective.includes("locale: NetworkLocale = 'ar'"));
    assert.ok(objective.includes('nextPuzzle.title.en'));
    assert.ok(objective.includes("actionLabel: 'Open Manhwa'"));
    assert.ok(objectiveCard.includes('deriveCorePlayerObjective(snapshot, locale)'));
    assert.ok(objectiveCard.includes('Current Echo objective'));
    assert.ok(shell.includes('Skip interface controls to content'));
    assert.ok(shell.includes('ENGLISH_CATEGORY_COPY'));
  });

  it('keeps the language control truthful by localizing its own settings surface', () => {
    const settings = source('src/features/screens/SettingsScreen.tsx');
    const localeBridge = source('src/app/LocaleDocumentBridge.tsx');

    assert.ok(settings.includes('const SETTINGS_COPY'));
    assert.ok(settings.includes('const copy = SETTINGS_COPY[preferences.locale];'));
    assert.ok(settings.includes("heading: 'Experience settings'"));
    assert.ok(settings.includes("languageTitle: 'Language & interface direction'"));
    assert.ok(settings.includes("adsTitle: 'Ads & privacy'"));
    assert.ok(settings.includes("soundTitle: 'Sound & subtitles'"));
    assert.ok(settings.includes("aria-pressed={preferences.locale === 'en'}"));
    assert.ok(settings.includes('role="group" aria-label={copy.languageChoice}'));
    assert.ok(localeBridge.includes('useLayoutEffect'));
    assert.ok(localeBridge.includes('document.documentElement.dir = localeDirection(locale)'));
  });

  it('renders the onboarding story in the selected language and direction', () => {
    const onboarding = source('src/features/onboarding/FirstTimeOnboarding.tsx');

    assert.ok(onboarding.includes("welcomeTitle: 'Welcome to 11.11'"));
    assert.ok(onboarding.includes("missionTitle: 'You are entering a living story'"));
    assert.ok(onboarding.includes("missionAction: 'I understand the mission'"));
    assert.ok(onboarding.includes("dir={locale === 'ar' ? 'rtl' : 'ltr'}"));
    assert.ok(onboarding.includes('const copy = ONBOARDING_COPY[locale];'));
  });

  it('keeps Manhwa titles, descriptions, loading, and recovery states locale-aware', () => {
    const viewer = source('src/features/manhwa/ManhwaFullscreenViewer.tsx');
    const archive = source('src/features/screens/MemoryScreen.tsx');

    assert.ok(viewer.includes('const copy = VIEWER_COPY[locale];'));
    assert.ok(viewer.includes('currentPage.title[locale]'));
    assert.ok(viewer.includes('currentPage.accessibleDescription[locale]'));
    assert.ok(viewer.includes("error: 'Could not load this page'"));
    assert.ok(viewer.includes("dir={locale === 'ar' ? 'rtl' : 'ltr'}"));
    assert.ok(archive.includes('const copy = MEMORY_COPY[locale];'));
    assert.ok(archive.includes('activePage.title[locale]'));
    assert.ok(archive.includes('activePage.accessibleDescription[locale]'));
    assert.ok(archive.includes('nextGatePuzzle.title[locale]'));
  });

  it('uses the selected locale for the first three puzzle briefings, feedback, and reward', () => {
    const puzzle = source('src/features/screens/PuzzleScreen.tsx');
    const store = source('src/features/story-puzzles/storyPuzzleStore.ts');

    assert.ok(puzzle.includes('selectedPuzzle.title[locale]'));
    assert.ok(puzzle.includes('selectedPuzzle.objective[locale]'));
    assert.ok(puzzle.includes('selectedPuzzle.brief?.[locale]'));
    assert.ok(puzzle.includes('selectedPuzzle.completionMessage[locale]'));
    assert.ok(puzzle.includes('const signalCopy = locale === \'ar\''));
    assert.ok(puzzle.includes('probe.readout[locale]'));
    assert.ok(puzzle.includes('candidate.readout[locale]'));
    assert.ok(puzzle.includes('const imageCopy = locale === \'ar\''));
    assert.ok(puzzle.includes('retryGuidance(currentStage?.mechanic ?? selectedPuzzle.mechanic, locale)'));
    assert.ok(puzzle.includes("title: 'Memory shard acquired'"));
    assert.ok(puzzle.includes("continueManhwa: 'Continue the Manhwa'"));
    assert.ok(puzzle.includes('{copy.title}'));
    assert.ok(puzzle.includes('{copy.continueManhwa}'));
    assert.ok(puzzle.includes('actions.complete(selectedPuzzle.id, draft, locale)'));
    assert.ok(puzzle.includes('actions.unlockHint(selectedPuzzle.id, index, locale)'));
    assert.ok(store.includes('const STORY_PUZZLE_ERROR_COPY'));
    assert.ok(store.includes("friendlyError(error, locale)"));
    assert.ok(store.includes("rejected: 'The recovery is not complete yet. Recheck the signal and try again.'"));
    assert.equal(puzzle.includes('selectedPuzzle.title.ar'), false);
    assert.equal(puzzle.includes('selectedPuzzle.objective.ar'), false);
  });

  it('keeps post-reward achievement feedback in the selected language and direction', () => {
    const achievement = source('src/ui/presentation/AchievementPresentationOverlay.tsx');

    assert.ok(achievement.includes("const locale = useUiPreferencesStore((state) => state.locale);"));
    assert.ok(achievement.includes("dismiss: 'تخطي / متابعة'"));
    assert.ok(achievement.includes("dismiss: 'SKIP / CONTINUE'"));
    assert.ok(achievement.includes("dir={locale === 'ar' ? 'rtl' : 'ltr'}"));
    assert.ok(achievement.includes('aria-label={copy.dismissLabel}'));
  });

  it('keeps the Chess lobby and authoritative match briefing in the selected language', () => {
    const chess = source('src/features/echo-network/ContractChessPanel.tsx');

    assert.ok(chess.includes('const copy = chessCopy(locale);'));
    assert.ok(chess.includes('eyebrow={copy.authoritativeEyebrow}'));
    assert.ok(chess.includes('title={`${copy.contractLabel} · ${copy.variant(snapshot?.variant ?? \'standard\')}`}'));
    assert.ok(chess.includes('{copy.authoritativeDescription}'));
    assert.ok(chess.includes('{copy.settlementTitle}'));
    assert.ok(chess.includes('copy.pendingServerFinalization'));
    assert.ok(chess.includes('aria-live="polite"'));
    assert.equal(chess.includes('ownReceiptXp'), false);
    assert.equal(chess.includes('receiptReward'), false);
    assert.ok(chess.includes('copy.variant(snapshot?.variant ?? \'standard\')'));
    assert.ok(chess.includes('eyebrow={copy.standardEyebrow}'));
    assert.ok(chess.includes('eyebrow={copy.weeklyRotationEyebrow}'));
    assert.ok(chess.includes('title={copy.standardTitle}'));
    assert.ok(chess.includes('title={copy.anomalyTitle}'));
    assert.ok(chess.includes('{copy.cancel}'));
    assert.ok(chess.includes('{copy.echoBlack}'));
    assert.ok(chess.includes('{copy.youRed}'));
  });

  it('keeps Co-op training, lobby, and its server-owned live evidence in the selected language', () => {
    const coop = source('src/features/echo-network/CoopBreachPanel.tsx');

    assert.ok(coop.includes('const copy = COOP_COPY[locale];'));
    assert.ok(coop.includes('<TrainingBreach completed={eligibility.coopTrainingCompleted} onComplete={onTrainingComplete} locale={locale} />'));
    assert.ok(coop.includes('online.definition.title[locale]'));
    assert.ok(coop.includes('online.stage.objective[locale]'));
    assert.ok(coop.includes('online.stage.prompt[locale]'));
    assert.ok(coop.includes('clue[locale]'));
    assert.ok(coop.includes('hint[locale]'));
    assert.ok(coop.includes('selectedDefinition.title[locale]'));
    assert.ok(coop.includes('selectedDefinition.description[locale]'));
    assert.ok(coop.includes('MECHANIC_LABELS[online.stage.mechanic][locale]'));
    assert.ok(coop.includes('currentCoopAnswerWasRejected(room.state.events, online?.state.version)'));
    assert.ok(coop.includes('{copy.answerRejected}'));
    assert.ok(coop.includes('{copy.settlementTitle}'));
    assert.ok(coop.includes('copy.pendingServerFinalization'));
    assert.ok(coop.includes('aria-live="polite"'));
    assert.equal(coop.includes('ownReceiptXp'), false);
    assert.equal(coop.includes('receiptReward'), false);
    assert.ok(coop.includes('a vote alone is not enough'));
  });

  it('keeps the network hub legible before a player chooses Chess or Co-op', () => {
    const network = source('src/features/echo-network/EchoNetworkScreen.tsx');

    assert.ok(network.includes('const NETWORK_COPY'));
    assert.ok(network.includes('const copy = NETWORK_COPY[locale];'));
    assert.ok(network.includes('{copy.authGate}'));
    assert.ok(network.includes('{copy.chess}'));
    assert.ok(network.includes('{copy.coop}'));
    assert.ok(network.includes('{copy.masteryTitle}'));
    assert.ok(network.includes('{copy.syncingReceipts}'));
    assert.ok(network.includes('{copy.leaderboard}'));
    assert.ok(network.includes('{copy.refresh}'));
  });

  it('keeps live community rooms and all known realtime rejections in the selected language', () => {
    const liveRooms = source('src/features/echo-network/LiveSignalRooms.tsx');
    const realtime = source('src/features/echo-network/useRealtimeRoom.ts');

    assert.ok(liveRooms.includes('eyebrow={copy.communityEyebrow}'));
    assert.ok(liveRooms.includes('title={copy.communityTitle}'));
    assert.ok(liveRooms.includes('{copy.communityDescription}'));
    assert.ok(liveRooms.includes('{copy.communityConnect}'));
    assert.ok(liveRooms.includes('{copy.communityPresence(onlineCount)}'));
    assert.ok(liveRooms.includes('{copy.communityLeave}'));
    assert.ok(liveRooms.includes('displayName ?? copy.unknownSignal'));

    for (const code of [
      'websocket_required', 'origin_not_allowed', 'wrong_ticket_purpose', 'wrong_ticket_target',
      'wrong_room', 'wrong_channel', 'route_not_found', 'ticket_reused', 'ticket_required', 'invalid_ticket',
      'realtime_unavailable', 'session_missing', 'room_full', 'room_contract_mismatch',
      'room_unavailable', 'waiting_for_opponent', 'match_finished', 'case_not_active',
      'case_not_reviewed', 'version_conflict', 'not_a_player', 'not_your_turn', 'invalid_move',
      'illegal_move', 'invalid_answer', 'stage_attempts_exhausted', 'hints_exhausted',
      'invalid_preset', 'preset_only', 'message_too_large', 'invalid_message', 'invalid_room',
      'invalid_command', 'unsupported_command', 'message_rate_limited', 'party_launching',
      'party_launched', 'party_launch_missing', 'party_blocked', 'party_full',
      'party_leader_required', 'party_size_invalid', 'party_not_ready', 'active_match_in_progress', 'chess_party_size',
      'invalid_coop_case', 'invalid_chess_variant', 'invalid_party_mode',
      'invalid_ticket_request', 'ticket_request_too_large', 'invalid_ticket_target', 'invalid_party',
      'invalid_channel', 'invalid_case', 'invalid_variant', 'community_rules_required',
      'room_membership_required', 'ranked_locked', 'realtime_not_configured',
    ]) {
      assert.ok(realtime.includes(`${code}: { ar:`), `missing localized copy for ${code}`);
    }
  });
});
