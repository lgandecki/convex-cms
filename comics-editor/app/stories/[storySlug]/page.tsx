import { redirect } from "next/navigation";

export default function StoryPage({
  params,
}: {
  params: { storySlug: string };
}) {
  redirect(`/stories/${params.storySlug}/scenarios`);
}
