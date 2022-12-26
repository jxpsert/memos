import dayjs from "dayjs";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useParams } from "react-router-dom";
import { UNKNOWN_ID } from "../helpers/consts";
import { useGlobalStore, useLocationStore, useMemoStore, useUserStore } from "../store/module";
import useLoading from "../hooks/useLoading";
import toastHelper from "../components/Toast";
import MemoContent from "../components/MemoContent";
import MemoResources from "../components/MemoResources";
import "../less/memo-detail.less";

interface State {
  memo: Memo;
}

const MemoDetail = () => {
  const { t, i18n } = useTranslation();
  const params = useParams();
  const globalStore = useGlobalStore();
  const locationStore = useLocationStore();
  const memoStore = useMemoStore();
  const userStore = useUserStore();
  const [state, setState] = useState<State>({
    memo: {
      id: UNKNOWN_ID,
    } as Memo,
  });
  const loadingState = useLoading();
  const customizedProfile = globalStore.state.systemStatus.customizedProfile;
  const user = userStore.state.user;
  const location = locationStore.state;

  useEffect(() => {
    const memoId = Number(params.memoId);
    if (memoId && !isNaN(memoId)) {
      memoStore
        .fetchMemoById(memoId)
        .then((memo) => {
          setState({
            memo,
          });
          loadingState.setFinish();
        })
        .catch((error) => {
          console.error(error);
          toastHelper.error(error.response.data.message);
        });
    }
  }, [location]);

  return (
    <section className="page-wrapper memo-detail">
      <div className="page-container">
        <div className="page-header">
          <div className="title-container">
            <img className="logo-img" src={customizedProfile.logoUrl} alt="" />
            <p className="logo-text">{customizedProfile.name}</p>
          </div>
          <div className="action-button-container">
            {!loadingState.isLoading && (
              <>
                {user ? (
                  <Link to="/" className="btn">
                    <span className="icon">🏠</span> {t("common.back-to-home")}
                  </Link>
                ) : (
                  <Link to="/auth" className="btn">
                    <span className="icon">👉</span> {t("common.sign-in")}
                  </Link>
                )}
              </>
            )}
          </div>
        </div>
        {!loadingState.isLoading && (
          <main className="memos-wrapper">
            <div className="memo-container">
              <div className="memo-header">
                <div className="status-container">
                  <span className="time-text">{dayjs(state.memo.displayTs).locale(i18n.language).format("YYYY/MM/DD HH:mm:ss")}</span>
                  <a className="name-text" href={`/u/${state.memo.creator.id}`}>
                    @{state.memo.creator.nickname || state.memo.creator.username}
                  </a>
                </div>
              </div>
              <MemoContent className="memo-content" content={state.memo.content} onMemoContentClick={() => undefined} />
              <MemoResources resourceList={state.memo.resourceList} />
            </div>
          </main>
        )}
      </div>
    </section>
  );
};

export default MemoDetail;
