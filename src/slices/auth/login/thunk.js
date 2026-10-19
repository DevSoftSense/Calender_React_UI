//Include Both Helper File with needed methods
import { getFirebaseBackend } from "../../../helpers/firebase_helper";
import {
  postJwtLogin,
} from "../../../helpers/fakebackend_helper";

import { loginSuccess, logoutUserSuccess, apiError, reset_login_flag } from './reducer';

const getAuthMode = () => process.env.REACT_APP_DEFAULTAUTH || "fake";

const loginLocally = (user, history, dispatch) => {
  const authUser = {
    uid: 1,
    username: "Admin",
    email: user.email,
    role: "admin",
    token: "fake-token",
  };
  sessionStorage.setItem("authUser", JSON.stringify(authUser));
  dispatch(loginSuccess(authUser));
  history("/dashboard");
};

export const loginUser = (user, history) => async (dispatch) => {
  try {
    const authMode = getAuthMode();
    let response;
    if (authMode === "firebase") {
      let fireBaseBackend = getFirebaseBackend();
      response = fireBaseBackend.loginUser(
        user.email,
        user.password
      );
    } else if (authMode === "jwt") {
      response = postJwtLogin({
        email: user.email,
        password: user.password
      });
    } else {
      // No backend: sign in locally and open the dashboard
      loginLocally(user, history, dispatch);
      return;
    }

    var data = await response;

    if (data) {
      if (authMode === "jwt") {
        // Store token + user profile for Calendar API
        sessionStorage.setItem("authUser", JSON.stringify(data));
        if (data.token) {
          const { setAuthorization } = await import("../../../helpers/api_helper");
          setAuthorization(data.token);
        }
        dispatch(loginSuccess(data));
        history("/dashboard");
      } else {
        sessionStorage.setItem("authUser", JSON.stringify(data));
        dispatch(loginSuccess(data));
        history("/dashboard");
      }
    }
  } catch (error) {
    const payload =
      typeof error === "string"
        ? { data: error }
        : { data: error?.message || error?.data || "Login failed" };
    dispatch(apiError(payload));
  }
};

export const logoutUser = () => async (dispatch) => {
  try {
    sessionStorage.removeItem("authUser");
    let fireBaseBackend = getFirebaseBackend();
    if (process.env.REACT_APP_DEFAULTAUTH === "firebase") {
      const response = fireBaseBackend.logout;
      dispatch(logoutUserSuccess(response));
    } else {
      dispatch(logoutUserSuccess(true));
    }

  } catch (error) {
    dispatch(apiError(error));
  }
};

export const socialLogin = (type, history) => async (dispatch) => {
  try {
    let response;

    if (process.env.REACT_APP_DEFAULTAUTH === "firebase") {
      const fireBaseBackend = getFirebaseBackend();
      response = fireBaseBackend.socialLoginUser(type);
    }
    //  else {
      //   response = postSocialLogin(data);
      // }
      
      const socialdata = await response;
    if (socialdata) {
      sessionStorage.setItem("authUser", JSON.stringify(response));
      dispatch(loginSuccess(response));
      history('/dashboard')
    }

  } catch (error) {
    dispatch(apiError(error));
  }
};

export const resetLoginFlag = () => async (dispatch) => {
  try {
    const response = dispatch(reset_login_flag());
    return response;
  } catch (error) {
    dispatch(apiError(error));
  }
};
