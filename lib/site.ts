export const repo = "https://github.com/sehajmakkar/learn";

/** Pre-filled "report a mistake" issue for a lesson. */
export const issueUrl = (title: string) => `${repo}/issues/new?title=${encodeURIComponent(`${title}: `)}`;

/** GitHub's editor for a lesson's source file. */
export const editUrl = (file: string) => `${repo}/edit/main/${file}`;
