export const getUser = () => {
  let userData = localStorage.getItem("flixxItUser")
    ? JSON.parse(localStorage.getItem("flixxItUser"))
    : null;

  return userData;
};

export const getUserToken = () => {
  let userToken = localStorage.getItem("flixxItToken")
    ? localStorage.getItem("flixxItToken")
    : null;

  return userToken;
};


export const clearCache = () => {
  localStorage.clear();
  sessionStorage.clear();
};