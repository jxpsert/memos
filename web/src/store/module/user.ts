import store, { useAppSelector } from "..";
import * as api from "../../helpers/api";
import * as storage from "../../helpers/storage";
import { UNKNOWN_ID } from "../../helpers/consts";
import { getSystemColorScheme } from "../../helpers/utils";
import { setAppearance, setLocale } from "../reducer/global";
import { setUser, patchUser, setHost, setOwner } from "../reducer/user";

const defaultSetting: Setting = {
  locale: "en",
  appearance: getSystemColorScheme(),
  memoVisibility: "PRIVATE",
  memoDisplayTsOption: "created_ts",
};

const defaultLocalSetting: LocalSetting = {
  enableFoldMemo: true,
  enablePowerfulEditor: true,
};

export const convertResponseModelUser = (user: User): User => {
  const setting: Setting = {
    ...defaultSetting,
  };
  const { localSetting: storageLocalSetting } = storage.get(["localSetting"]);
  const localSetting: LocalSetting = {
    ...defaultLocalSetting,
    ...storageLocalSetting,
  };

  if (user.userSettingList) {
    for (const userSetting of user.userSettingList) {
      (setting as any)[userSetting.key] = JSON.parse(userSetting.value);
    }
  }

  return {
    ...user,
    setting,
    localSetting,
    createdTs: user.createdTs * 1000,
    updatedTs: user.updatedTs * 1000,
  };
};

export const initialUserState = async () => {
  const { systemStatus } = store.getState().global;

  if (systemStatus.host) {
    store.dispatch(setHost(convertResponseModelUser(systemStatus.host)));
  }

  const ownerUserId = getUserIdFromPath();
  if (ownerUserId) {
    const { data: owner } = (await api.getUserById(ownerUserId)).data;
    if (owner) {
      store.dispatch(setOwner(convertResponseModelUser(owner)));
    }
  }

  const { data } = (await api.getMyselfUser()).data;
  if (data) {
    const user = convertResponseModelUser(data);
    store.dispatch(setUser(user));
    if (user.setting.locale) {
      store.dispatch(setLocale(user.setting.locale));
    }
    if (user.setting.appearance) {
      store.dispatch(setAppearance(user.setting.appearance));
    }
  }
};

const getUserIdFromPath = () => {
  const { pathname } = store.getState().location;
  const userIdRegex = /^\/u\/(\d+).*/;
  const result = pathname.match(userIdRegex);
  if (result && result.length === 2) {
    return Number(result[1]);
  }
  return undefined;
};

const doSignIn = async () => {
  const { data: user } = (await api.getMyselfUser()).data;
  if (user) {
    store.dispatch(setUser(convertResponseModelUser(user)));
  } else {
    doSignOut();
  }
  return user;
};

const doSignOut = async () => {
  store.dispatch(setUser());
  await api.signout();
};

export const useUserStore = () => {
  const state = useAppSelector((state) => state.user);

  const isVisitorMode = () => {
    return !(getUserIdFromPath() === undefined);
  };

  return {
    state,
    getState: () => {
      return store.getState().user;
    },
    isVisitorMode,
    getUserIdFromPath,
    doSignIn,
    doSignOut,
    getCurrentUserId: () => {
      if (isVisitorMode()) {
        return getUserIdFromPath() || UNKNOWN_ID;
      } else {
        return state.user?.id || UNKNOWN_ID;
      }
    },
    getUserById: async (userId: UserId) => {
      const { data: user } = (await api.getUserById(userId)).data;
      if (user) {
        return convertResponseModelUser(user);
      } else {
        return undefined;
      }
    },
    upsertUserSetting: async (key: keyof Setting, value: any) => {
      await api.upsertUserSetting({
        key: key as any,
        value: JSON.stringify(value),
      });
      await doSignIn();
    },
    upsertLocalSetting: async (localSetting: LocalSetting) => {
      storage.set({ localSetting });
      store.dispatch(patchUser({ localSetting }));
    },
    patchUser: async (userPatch: UserPatch): Promise<void> => {
      const { data } = (await api.patchUser(userPatch)).data;
      if (userPatch.id === store.getState().user.user?.id) {
        const user = convertResponseModelUser(data);
        store.dispatch(patchUser(user));
      }
    },
    deleteUser: async (userDelete: UserDelete) => {
      await api.deleteUser(userDelete);
    },
  };
};
