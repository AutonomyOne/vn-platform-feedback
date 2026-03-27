import { FeedbackUser } from "../index";

export interface FeedbackButtonProps {
  user?: FeedbackUser;
  style?: Record<string, string | number>;
}

/** Floating feedback trigger button. Drop into your app root layout. */
declare const FeedbackButton: (props: FeedbackButtonProps) => JSX.Element;
export default FeedbackButton;
