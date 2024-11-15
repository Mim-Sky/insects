import Link from "next/link";

export default function DesktopLink({ title, path }) {
  return (
    <Link href={path} className="p-4 ease-in-out duration-200 xl:text-xl font-semibold hover:text-earth-gray">{title}</Link>
  )
}