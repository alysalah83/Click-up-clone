"use client";

import { memo } from "react";
import { FEATURE_COMPONENTS } from "../board.const";
import { TASK_FEATURES } from "@/features/task/constants/tasks.const";

function FeatureBtns() {
  return (
    <>
      {TASK_FEATURES.map((feature) => {
        const { id, icon, label } = feature;
        const Component = FEATURE_COMPONENTS[feature.id];
        return <Component icon={icon} label={label} key={`board-${id}`} />;
      })}
    </>
  );
}

export default memo(FeatureBtns);
