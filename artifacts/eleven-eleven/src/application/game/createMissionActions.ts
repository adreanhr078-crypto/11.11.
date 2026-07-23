import type { GameActions } from '../../core/gameTypes';
import {
  getDailyMissions,
  shouldRefreshMissions,
} from '../../core/dailyMissions';
import type { GameStateGetter, GameStateSetter } from './statePorts';

type MissionActions = Pick<
  GameActions,
  'completeDailyMission' | 'refreshDailyMissions'
>;

export function createMissionActions(
  set: GameStateSetter,
  get: GameStateGetter,
): MissionActions {
  return {
    completeDailyMission: (missionId) => {
      const state = get();
      const mission = state.dailyMissions.find(({ id }) => id === missionId);
      if (!mission) {
        return { success: false, message: 'المهمة غير موجودة' };
      }
      if (mission.completed) {
        return { success: false, message: 'المهمة مكتملة بالفعل' };
      }

      set({
        dailyMissions: state.dailyMissions.map((item) => (
          item.id === missionId ? { ...item, completed: true } : item
        )),
        echo: {
          ...state.echo,
          coins: state.echo.coins + mission.reward.coins,
          crystals: state.echo.crystals + mission.reward.crystals,
        },
      });

      return {
        success: true,
        message: `اكتملت المهمة: ${mission.title.ar}`,
        reward: mission.reward,
      };
    },

    refreshDailyMissions: () => {
      const state = get();
      if (!shouldRefreshMissions(state.lastMissionRefresh)) return;
      const solvedPuzzleIds = state.progression.completedPuzzleIds;
      set({
        dailyMissions: getDailyMissions(solvedPuzzleIds),
        lastMissionRefresh: Date.now(),
      });
    },
  };
}
