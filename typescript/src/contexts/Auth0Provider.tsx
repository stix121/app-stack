import { useEffect, useReducer, ReactNode } from "react";
import { Auth0Client } from "@auth0/auth0-spa-js";

import { ActionMap, AuthState, AuthUser } from "../types/auth";
import { auth0Config } from "../config";

import AuthContext from "./Auth0Context";

const INITIALIZE = "INITIALIZE";
const SIGN_IN = "SIGN_IN";
const SIGN_OUT = "SIGN_OUT";

let auth0Client: Auth0Client | null = null;

const initialState = {
  isAuthenticated: false,
  isInitialized: false,
  user: null,
};

type AuthActionTypes = {
  [INITIALIZE]: {
    isAuthenticated: boolean;
    user: AuthUser;
  };
  [SIGN_IN]: {
    user: AuthUser;
  };
  [SIGN_OUT]: undefined;
};

type Auth0Actions =
  ActionMap<AuthActionTypes>[keyof ActionMap<AuthActionTypes>];

const reducer = (state: AuthState, action: Auth0Actions) => {
  if (action.type === INITIALIZE) {
    const { isAuthenticated, user } = action.payload;
    return {
      ...state,
      isAuthenticated,
      isInitialized: true,
      user,
    };
  }
  if (action.type === SIGN_IN) {
    const { user } = action.payload;
    return { ...state, isAuthenticated: true, user };
  }
  if (action.type === SIGN_OUT) {
    return {
      ...state,
      isAuthenticated: false,
      user: null,
    };
  }
  return state;
};

function AuthProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    const initialize = async () => {
      try {
        auth0Client = new Auth0Client({
          client_id: auth0Config.clientId || "",
          domain: auth0Config.domain || "",
          redirect_uri: window.location.origin,
        });

        await auth0Client.checkSession();

        const isAuthenticated = await auth0Client.isAuthenticated();

        if (isAuthenticated) {
          const user = await auth0Client.getUser();

          dispatch({
            type: INITIALIZE,
            payload: { isAuthenticated, user: user || null },
          });
        } else {
          dispatch({
            type: INITIALIZE,
            payload: { isAuthenticated, user: null },
          });
        }
      } catch (err) {
        console.error(err);
        dispatch({
          type: INITIALIZE,
          payload: { isAuthenticated: false, user: null },
        });
      }
    };

    initialize();
  }, []);

  const signIn = async () => {
    await auth0Client?.loginWithPopup();
    const isAuthenticated = await auth0Client?.isAuthenticated();

    if (isAuthenticated) {
      const user = await auth0Client?.getUser();
      dispatch({ type: SIGN_IN, payload: { user: user || null } });
    }
  };

  const signOut = () => {
    auth0Client?.logout();
    dispatch({ type: SIGN_OUT });
  };

  const resetPassword = (email: string) => {};

  return (
    <AuthContext.Provider
      value={{
        ...state,
        method: "auth0",
        user: {
          id: state?.user?.sub,
          avatar: state?.user?.picture,
          email: state?.user?.email,
          displayName: "Lucy",
          role: "user",
        },
        signIn,
        signOut,
        resetPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export default AuthProvider;
