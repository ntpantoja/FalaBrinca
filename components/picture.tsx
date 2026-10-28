import type { Choice } from "../lib/catalog";
export function Picture({ choice }: { choice: Choice }) {
  return choice.image_url ? (
    <img
      className="activity-image"
      src={choice.image_url}
      alt=""
      draggable={false}
      referrerPolicy="no-referrer"
    />
  ) : (
    <span aria-hidden="true">{choice.emoji}</span>
  );
}
