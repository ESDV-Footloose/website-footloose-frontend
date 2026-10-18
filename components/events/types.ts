export type RichTextChild = {
  text?: string;
  type?: string;
};

/** Representation of a rich text block. */
export type RichTextBlock = {
  children?: RichTextChild[];
};

/** Representation of one event in the event overview */
export type EventListItem = {
  /** Unique document ID of the event. */
  documentId: string;
  /** The event's name. */
  name: string;
  /** The event's website slug. */
  slug: string;
  /** The event's date. */
  date: string;
  /** The optional event image + alt text. */
  image: {
    url: string;
    alternativeText: string | null;
  } | null;
  /** The description of the event. */
  description: RichTextBlock[];
  /** The general price of the event. */
  price: number;
  /** The member price of the event. If not defined, the member price is the general price. */
  memberPrice: number | null;
  /** Whether the event is for members only or open for all. */
  membersOnly: boolean;
  /** Whether the event requires a user to subscribe. */
  requiresSubscription: boolean;
  /** The maximum number of subscriptions. */
  personLimit: number | null;
  /** How many users have subscribed for the event. */
  spotsTaken: number;
  /** Whether there are no free spots for the event. */
  isFull: boolean;
};

export type EventsPage = {
  events: EventListItem[];
  hasMore: boolean;
};
