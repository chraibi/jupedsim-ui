import { useEffect } from "react";

const useEscapeHandler = (callbacks) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        // Call all the callbacks passed as an object
        Object.values(callbacks).forEach((callback) => {
          if (typeof callback === "function") {
            callback();
          }
        });
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [callbacks]);
};

export default useEscapeHandler;
