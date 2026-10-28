"use client";
import { useEffect, useState } from "react";
import type { Choice } from "../lib/catalog";
export function Picture({ choice }: { choice: Choice }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [choice.image_url]);
  return choice.image_url && !failed ? (
    <img
      className="activity-image"
      src={choice.image_url}
      alt=""
      draggable={false}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
    />
  ) : (
    <span aria-hidden="true">{choice.emoji}</span>
  );
}
