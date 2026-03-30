import { useContext } from "react";
import { GroupContext } from "../context/GroupContext";

export function useSelectedGroup() {
    const context = useContext(GroupContext);

    if (!context) {
        throw new Error("useSelectedGroup must be used within GroupProvider");
    }

    return context;
}