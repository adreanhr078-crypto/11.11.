import { useEffect, useState } from 'react';
import {
  ArrowLeft,
  CalendarDays,
  Check,
  Copy,
  Gem,
  Link2,
  LogOut,
  Puzzle,
  ShieldCheck,
  Sparkles,
  Trophy,
  UserRound,
} from 'lucide-react';
import {
  GameButton,
  GameProgress,
  HudPanel,
} from '../../ui/design-system';
import {
  playerAvatarPresentationSrc,
  playerAvatarSrc,
  PLAYER_AVATAR_CATALOG,
  unlockedPlayerAvatarCatalog,
} from '../../ui/presentation/playerAvatarCatalog';
import { ENVIRONMENT_PRESENTATION_ASSETS } from '../../ui/presentation/visualAssets';
import {
  PROFILE_BIO_MAX_LENGTH,
  type PlayerAvatarId,
} from '../../domain/player-profile/playerProfile';
import { AuthStatusButton } from '../auth/AuthStatusButton';
import { useAuthStore } from '../auth/authStore';
import { useShellStore } from '../../app/shell/shellStore';
import { usePlayerProgressionStore } from './playerProgressionStore';
import { useCollectionStore } from '../collection/collectionStore';
import { useLiveChallengeStore } from '../live-challenges/liveChallengeStore';

const numberFormatter = new Intl.NumberFormat('en-US');
const joinDateFormatter = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

export default function ProfileScreen() {
  const shell = useShellStore();
  const authStatus = useAuthStore((state) => state.status);
  const authUser = useAuthStore((state) => state.user);
  const authBusy = useAuthStore((state) => state.busy);
  const authError = useAuthStore((state) => state.error);
  const authActions = useAuthStore((state) => state.actions);
  const profile = usePlayerProgressionStore((state) => state.profile);
  const profileStatus = usePlayerProgressionStore((state) => state.profileStatus);
  const profileError = usePlayerProgressionStore((state) => state.profileError);
  const loadProfile = usePlayerProgressionStore((state) => state.actions.loadProfile);
  const updateProfile = usePlayerProgressionStore((state) => state.actions.updateProfile);
  const collection = useCollectionStore((state) => state.snapshot);
  const collectionActions = useCollectionStore((state) => state.actions);
  const liveSnapshot = useLiveChallengeStore((state) => state.snapshot);
  const liveStatus = useLiveChallengeStore((state) => state.status);
  const loadLive = useLiveChallengeStore((state) => state.actions.load);
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [avatarId, setAvatarId] = useState<PlayerAvatarId>('echo');
  const [guestEmail, setGuestEmail] = useState('');
  const [guestPassword, setGuestPassword] = useState('');
  const [guestName, setGuestName] = useState('');
  const [saved, setSaved] = useState(false);
  const [showcaseIds, setShowcaseIds] = useState<string[]>([]);
  const [copiedSubject, setCopiedSubject] = useState(false);

  useEffect(() => {
    if (authStatus === 'signed-in') void loadProfile();
  }, [authStatus, loadProfile]);

  useEffect(() => {
    if (authStatus === 'signed-in' && liveStatus === 'idle') void loadLive();
  }, [authStatus, loadLive, liveStatus]);

  useEffect(() => {
    if (!profile) return;
    setUsername(profile.username);
    setBio(profile.bio);
    setAvatarId(profile.avatarId);
    setShowcaseIds(profile.featuredAchievementIds.slice(0, 3));
  }, [profile]);

  if (authStatus !== 'signed-in' || !authUser) {
    return (
      <div className="shell-screen player-profile-screen">
        <HudPanel
          className="player-profile-screen__gate"
          tone="progression"
          eyebrow="ACCOUNT REQUIRED"
          title="Sign in to open your profile"
        >
          <AuthStatusButton variant="progression" />
        </HudPanel>
      </div>
    );
  }

  const save = async () => {
    setSaved(false);
    const didSave = await updateProfile({ username, bio, avatarId, featuredAchievementIds: showcaseIds });
    setSaved(didSave);
  };

  const selectedAvatar = PLAYER_AVATAR_CATALOG.find((avatar) => avatar.id === avatarId)
    ?? PLAYER_AVATAR_CATALOG[0];
  const availableAvatars = unlockedPlayerAvatarCatalog(profile?.unlockedAvatarIds);

  const linkGuestEmail = async () => {
    await authActions.linkAnonymousAccountWithEmail(
      guestEmail,
      guestPassword,
      guestName,
    );
    setGuestPassword('');
  };

  const copySubjectId = async () => {
    if (!navigator.clipboard || !profile) return;
    try {
      await navigator.clipboard.writeText(profile.subjectId);
      setCopiedSubject(true);
      window.setTimeout(() => setCopiedSubject(false), 1400);
    } catch {
      setCopiedSubject(false);
    }
  };

  return (
    <div className="shell-screen player-profile-screen" dir="rtl">
      <header className="profile-screen-heading">
        <div className="profile-screen-heading__title">
          <span className="profile-screen-heading__eyebrow">11.11 // IDENTITY SYSTEM</span>
          <h1>الملف الشخصي</h1>
          <small>PLAYER PROFILE // VERIFIED SUBJECT RECORD</small>
        </div>
        <div className="profile-screen-heading__actions">
          <GameButton
            variant="ghost"
            leadingIcon={<ArrowLeft aria-hidden="true" />}
            onClick={() => shell.navigate('main-menu')}
          >
            رجوع
          </GameButton>
          <GameButton
            variant="danger"
            leadingIcon={<LogOut aria-hidden="true" />}
            onClick={() => void authActions.signOut().then(() => shell.navigate('main-menu'))}
          >
            تسجيل الخروج
          </GameButton>
        </div>
      </header>

      {profileStatus === 'error' && (
        <div className="player-profile-screen__error" role="alert">
          <span>{profileError}</span>
          <GameButton variant="secondary" onClick={() => void loadProfile()}>
            Retry
          </GameButton>
        </div>
      )}

      {profile ? (
        <div className="player-profile-screen__layout">
          <aside className="player-profile-hero" aria-label="Player identity visual">
            <div
              className="player-profile-hero__world"
              style={{ backgroundImage: `url("${ENVIRONMENT_PRESENTATION_ASSETS.mainMenuWorld}")` }}
              aria-hidden="true"
            />
            <div className="player-profile-hero__grid" aria-hidden="true" />
            <div className="player-profile-hero__brand" dir="ltr">
              <strong><b>11</b>.11</strong>
              <small>ECHO SYSTEM // PLAYER IDENTITY</small>
            </div>
            <div className="player-profile-hero__halo" aria-hidden="true"><i /><i /><i /></div>
            <img
              className={`player-profile-hero__character${selectedAvatar.id === 'echo' ? '' : ' player-profile-hero__character--portrait'}`}
              src={playerAvatarPresentationSrc(avatarId)}
              alt={selectedAvatar.label}
              draggable={false}
              decoding="async"
            />
            <div className="player-profile-hero__identity-chip">
              <img src={playerAvatarSrc(avatarId)} alt="" />
              <span>
                <small>PLAYER AVATAR</small>
                <strong>{profile.username}</strong>
              </span>
              <ShieldCheck aria-hidden="true" />
            </div>
            <div className="player-profile-hero__status">
              <span><i /> {profile.isAnonymous ? 'GUEST PROFILE' : 'ACCOUNT VERIFIED'}</span>
              <small>SUBJECT LINK // STABLE</small>
            </div>
          </aside>

          <div className="player-profile-screen__details">
            <section className="player-profile-overview" aria-labelledby="profile-overview-title">
              <div className="player-profile-overview__identity">
                <div className="player-profile-overview__avatar-wrap">
                  <span className="player-profile-overview__orbit" aria-hidden="true" />
                  <img
                    src={playerAvatarSrc(profile.avatarId)}
                    alt=""
                    className="player-profile-overview__avatar"
                  />
                </div>
                <div className="player-profile-overview__copy">
                  <span className="profile-ui-label">USERNAME</span>
                  <h2 id="profile-overview-title">{profile.username}</h2>
                  <button type="button" className="player-profile-subject" onClick={() => void copySubjectId()}>
                    <span><small>SUBJECT ID</small><strong>{profile.subjectId}</strong></span>
                    {copiedSubject ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
                  </button>
                  <span className="player-profile-join-date"><CalendarDays aria-hidden="true" /> JOINED {joinDateFormatter.format(new Date(profile.joinDate))}</span>
                  <p>{profile.bio || 'No identity signal written yet.'}</p>
                </div>
              </div>
              <div className="player-profile-metric player-profile-metric--level">
                <span className="profile-ui-label">المستوى / LEVEL</span>
                <strong>{profile.progression.level}</strong>
                <div className="player-profile-metric__glyph" aria-hidden="true"><Sparkles /></div>
                <GameProgress
                  value={profile.progression.progressPercent}
                  tone="progression"
                  label={profile.progression.xpForNextLevel === null
                    ? 'MAX LEVEL'
                    : `${numberFormatter.format(profile.progression.xpIntoLevel)} / ${numberFormatter.format(profile.progression.xpForNextLevel)} XP`}
                  showValue={false}
                />
                <small>{numberFormatter.format(profile.progression.totalXp)} TOTAL XP</small>
              </div>
              <div className="player-profile-metric player-profile-metric--rank">
                <span className="profile-ui-label">الترتيب العالمي / GLOBAL RANK</span>
                <strong>#{numberFormatter.format(profile.progression.rank)}</strong>
                <div className="player-profile-metric__glyph" aria-hidden="true"><Trophy /></div>
                <small>CALCULATED FROM LEADERBOARD</small>
              </div>
            </section>

            <section className="player-profile-stats" aria-label="Verified player statistics">
              <article className="player-profile-stat-card player-profile-stat-card--cyan">
                <Trophy aria-hidden="true" />
                <strong>{profile.stats.chaptersCompleted}</strong>
                <span>الفصول المكتملة</span>
                <small>CHAPTERS COMPLETED</small>
              </article>
              <article className="player-profile-stat-card player-profile-stat-card--cyan">
                <Puzzle aria-hidden="true" />
                <strong>{profile.stats.puzzlesSolved}</strong>
                <span>الألغاز المحلولة</span>
                <small>PUZZLES SOLVED</small>
              </article>
              <article className="player-profile-stat-card player-profile-stat-card--violet">
                <Gem aria-hidden="true" />
                <strong>{profile.stats.secretsFound}</strong>
                <span>الأسرار المكتشفة</span>
                <small>SECRETS FOUND</small>
              </article>
            </section>

            {liveSnapshot && (
              <section className="player-profile-live-stats" aria-label="Live system mastery">
                <div>
                  <span>LIVE SIGNALS RECOVERED</span>
                  <strong>{numberFormatter.format(liveSnapshot.mastery.dailySignalsRecovered)}</strong>
                  <small>DAILY 11:11 RECORDS</small>
                </div>
                <div>
                  <span>WEEKLY TRIALS COMPLETED</span>
                  <strong>{numberFormatter.format(liveSnapshot.mastery.weeklyTrialsCompleted)}</strong>
                  <small>SYSTEM MASTERY // SEPARATE FROM RECOVERY</small>
                </div>
              </section>
            )}

            <section className="player-profile-lower-grid">
              <div className="player-profile-editor">
                <div className="player-profile-section-heading">
                  <div><span className="profile-ui-label">IDENTITY CONTROLS</span><h2>تعديل الملف الشخصي</h2></div>
                  <UserRound aria-hidden="true" />
                </div>
                <div className="player-profile-edit-grid">
                  <label className="player-profile-field">
                    <span>USERNAME</span>
                    <input value={username} maxLength={28} onChange={(event) => setUsername(event.target.value)} />
                  </label>
                  <label className="player-profile-field">
                    <span>BIO // {bio.length}/{PROFILE_BIO_MAX_LENGTH}</span>
                    <textarea value={bio} maxLength={PROFILE_BIO_MAX_LENGTH} rows={2} onChange={(event) => setBio(event.target.value)} />
                  </label>
                </div>
                <div className="player-profile-avatar-picker">
                  <span>AVATAR // IN-GAME ASSETS ONLY</span>
                  <div>
                    {availableAvatars.map((avatar) => (
                      <button
                        key={avatar.id}
                        type="button"
                        className="player-profile-avatar-option"
                        data-selected={avatarId === avatar.id}
                        aria-label={avatar.label}
                        aria-pressed={avatarId === avatar.id}
                        onClick={() => setAvatarId(avatar.id)}
                      >
                        <img src={avatar.src} alt="" />
                        <small>{avatar.label}</small>
                        {avatar.rarity === 'rare' && <span className="player-profile-avatar-option__rare">RARE</span>}
                        {avatarId === avatar.id && <Check aria-hidden="true" />}
                      </button>
                    ))}
                  </div>
                </div>
                <GameButton variant="progression" fullWidth loading={profileStatus === 'loading'} onClick={() => void save()}>
                  {saved ? 'تم حفظ الملف' : 'حفظ التغييرات'}
                </GameButton>
              </div>

              <div className="player-profile-achievements-panel">
                {collection && (
                  <div className="player-profile-showcase-picker">
                    <small>SHOWCASE // SELECT UP TO 3 VERIFIED RECORDS</small>
                    <div>
                      {collection.achievements.filter((achievement) => achievement.unlocked).map((achievement) => {
                        const selected = showcaseIds.includes(achievement.id);
                        return (
                          <button
                            key={achievement.id}
                            type="button"
                            data-selected={selected}
                            disabled={!selected && showcaseIds.length >= 3}
                            onClick={() => setShowcaseIds((ids) => selected
                              ? ids.filter((id) => id !== achievement.id)
                              : [...ids, achievement.id].slice(0, 3))}
                          >
                            {achievement.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
                {collection && (
                  <div className="player-profile-cosmetics">
                    <small>EQUIPPED COSMETICS // SERVER VERIFIED</small>
                    <p>{collection.equipped.titleId ?? 'NO TITLE'} · {collection.equipped.frameId ?? 'NO FRAME'} · {collection.equipped.badgeId ?? 'NO BADGE'}</p>
                    <div>
                      {collection.cosmetics.filter((cosmetic) => cosmetic.owned).map((cosmetic) => (
                        <button key={cosmetic.id} type="button" data-equipped={cosmetic.equipped} onClick={() => void collectionActions.equip(cosmetic.id)}>
                          {cosmetic.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                <div className="player-profile-section-heading">
                  <div><span className="profile-ui-label">ACHIEVEMENT DISPLAY</span><h2>الإنجازات</h2></div>
                  <Sparkles aria-hidden="true" />
                </div>
                <div className="player-profile-achievements">
                  {profile.featuredAchievementIds.length > 0
                    ? profile.featuredAchievementIds.slice(0, 3).map((id) => (
                      <div className="player-profile-achievement-card" key={id}><Sparkles aria-hidden="true" /><span>{id}</span><small>VERIFIED ID</small></div>
                    ))
                    : <div className="player-profile-achievement-empty"><Sparkles aria-hidden="true" /><span>لا توجد إنجازات مميزة بعد</span><small>UP TO 3 FEATURED IDS</small></div>}
                </div>
              </div>
            </section>

            {authUser.isAnonymous && (
              <section className="player-profile-guest-panel">
                <div className="player-profile-section-heading">
                  <div><span className="profile-ui-label">GUEST PROFILE // TEMPORARY</span><h2>تأمين هوية اللاعب</h2></div>
                  <Link2 aria-hidden="true" />
                </div>
                <p className="player-profile-guest-copy">اربط الحساب للحفاظ على UID وSubject ID وXP والسجل التاريخي نفسه.</p>
                <div className="player-profile-guest-form">
                  <input value={guestName} placeholder="Display name" onChange={(event) => setGuestName(event.target.value)} />
                  <input value={guestEmail} type="email" placeholder="Email" onChange={(event) => setGuestEmail(event.target.value)} />
                  <input value={guestPassword} type="password" placeholder="Password" minLength={6} onChange={(event) => setGuestPassword(event.target.value)} />
                  <GameButton variant="danger" loading={authBusy} onClick={() => void linkGuestEmail()}>ربط البريد الإلكتروني</GameButton>
                  <GameButton variant="ghost" loading={authBusy} onClick={() => void authActions.linkAnonymousAccountWithGoogle()}>ربط حساب Google</GameButton>
                  {authError && <small role="alert">{authError}</small>}
                </div>
              </section>
            )}
          </div>
        </div>
      ) : (
        <HudPanel tone="progression" eyebrow="PROFILE" title="Loading profile..." />
      )}
    </div>
  );
}
