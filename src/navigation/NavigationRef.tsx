import { createNavigationContainerRef } from "@react-navigation/native";

export const navigationRef = createNavigationContainerRef();

export function navigate(name: string, params?: object) {
  if (navigationRef.isReady()) {
    navigationRef.navigate(name as never, params as never);
  }
}

export function navigateWhenReady(name: string, params?: object, retries = 10) {
  if (navigationRef.isReady()) {
    navigationRef.navigate(name as never, params as never);
    return;
  }

  if (retries <= 0) {
    return;
  }

  setTimeout(() => {
    navigateWhenReady(name, params, retries - 1);
  }, 250);
}