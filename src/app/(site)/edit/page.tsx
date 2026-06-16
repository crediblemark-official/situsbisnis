import { redirect } from "next/navigation";

/**
 * Direct shortcut route (/edit) that redirects the user 
 * to the CMS dashboard management page.
 */
export default function EditRedirect() {
  redirect("/credbuild");
}
