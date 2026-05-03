export type MenuLink = {
  text: string;
  href: string;
};

export type MenuSection = {
  title?: {
    text: string;
    href?: string;
  };
  links: MenuLink[];
};

export type NavItem = {
  text: string;
  href: string;
  menu?: MenuSection[];
};
