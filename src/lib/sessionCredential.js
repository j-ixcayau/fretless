export function sessionCredential(state, action) {
  switch (action.type) {
    case "accountChanged":
      return state.uid === action.uid ? state : { uid: action.uid, key: "" };
    case "save":
      return state.uid && state.uid === action.uid
        ? { uid: state.uid, key: action.key.trim() }
        : state;
    case "clear":
      return { uid: null, key: "" };
    default:
      return state;
  }
}
