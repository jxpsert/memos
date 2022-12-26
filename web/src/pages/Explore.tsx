import dayjs from "dayjs";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { useGlobalStore, useLocationStore, useMemoStore, useUserStore } from "../store/module";
import { DEFAULT_MEMO_LIMIT } from "../helpers/consts";
import useLoading from "../hooks/useLoading";
import toastHelper from "../components/Toast";
import MemoContent from "../components/MemoContent";
import MemoResources from "../components/MemoResources";
import "../less/explore.less";

interface State {
  memos: Memo[];
}

const Explore = () => {
  const { t, i18n } = useTranslation();
  const globalStore = useGlobalStore();
  const locationStore = useLocationStore();
  const userStore = useUserStore();
  const memoStore = useMemoStore();
  const [state, setState] = useState<State>({
    memos: [],
  });
  const [isComplete, setIsComplete] = useState<boolean>(false);
  const loadingState = useLoading();
  const customizedProfile = globalStore.state.systemStatus.customizedProfile;
  const user = userStore.state.user;
  const location = locationStore.state;

  useEffect(() => {
    memoStore.fetchAllMemos(DEFAULT_MEMO_LIMIT, state.memos.length).then((memos) => {
      if (memos.length < DEFAULT_MEMO_LIMIT) {
        setIsComplete(true);
      }
      setState({
        memos,
      });
      loadingState.setFinish();
    });
  }, [location]);

  const handleFetchMoreClick = async () => {
    try {
      const fetchedMemos = await memoStore.fetchAllMemos(DEFAULT_MEMO_LIMIT, state.memos.length);
      if (fetchedMemos.length < DEFAULT_MEMO_LIMIT) {
        setIsComplete(true);
      } else {
        setIsComplete(false);
      }
      setState({
        memos: state.memos.concat(fetchedMemos),
      });
    } catch (error: any) {
      console.error(error);
      toastHelper.error(error.response.data.message);
    }
  };

  return (
    <section className="page-wrapper explore">
      <div className="page-container">
        <div className="page-header">
          <div className="title-container">
            <img className="logo-img" src={customizedProfile.logoUrl} alt="" />
            <span className="title-text">{customizedProfile.name}</span>
          </div>
          <div className="action-button-container">
            {!loadingState.isLoading && user ? (
              <Link to="/" className="link-btn btn-normal">
                <span>🏠</span> {t("common.back-to-home")}
              </Link>
            ) : (
              <Link to="/auth" className="link-btn btn-normal">
                <span>👉</span> {t("common.sign-in")}
              </Link>
            )}
          </div>
        </div>
        {!loadingState.isLoading && (
          <main className="memos-wrapper">
            {state.memos.map((memo) => {
              const createdAtStr = dayjs(memo.displayTs).locale(i18n.language).format("YYYY/MM/DD HH:mm:ss");
              return (
                <div className="memo-container" key={memo.id}>
                  <div className="memo-header">
                    <span className="time-text">{createdAtStr}</span>
                    <a className="name-text" href={`/u/${memo.creator.id}`}>
                      @{memo.creator.nickname || memo.creator.username}
                    </a>
                  </div>
                  <MemoContent className="memo-content" content={memo.content} onMemoContentClick={() => undefined} />
                  <MemoResources resourceList={memo.resourceList} />
                </div>
              );
            })}
            {isComplete ? (
              state.memos.length === 0 ? (
                <p className="w-full text-center mt-12 text-gray-600">{t("message.no-memos")}</p>
              ) : null
            ) : (
              <p
                className="m-auto text-center mt-4 italic cursor-pointer text-gray-500 hover:text-green-600"
                onClick={handleFetchMoreClick}
              >
                {t("memo-list.fetch-more")}
              </p>
            )}
          </main>
        )}
      </div>
    </section>
  );
};

export default Explore;
