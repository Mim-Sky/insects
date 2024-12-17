import client, { urlFor } from "@/sanityClient";
import { Insect } from "@/sanity/types/types";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface InsectDetailsProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateStaticParams() {
  const insects = await client.fetch<{ slug: { current: string } }[]>(
    `*[_type == "insect"]{ "slug": slug.current }`
  );

  return insects.map((insect) => ({
    slug: insect.slug,
  }));
}

const InsectDetails = async ({ params }: InsectDetailsProps) => {
  const { slug } = await params;

  if (!slug) {
    return <div className="text-center p-8 text-2xl text-red-600">Invalid route</div>;
  }

  const insect = await client.fetch<Insect>(
    `*[_type == "insect" && slug.current == $slug][0]{
      title,
      description,
      image,
      latinTitle,
      
    }`,
    { slug }
  );

  if (!insect) {
    return <div className="text-center p-8 text-2xl text-red-600">404 - Insect Not Found</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-green-100">
      <div className="container mx-auto px-4 py-8">
        <Card className="overflow-hidden shadow-xl">
          <div className="relative h-64 sm:h-80 md:h-96">
            <Image
              src={urlFor(insect.image).url()}
              alt={insect.title}
              layout="fill"
              objectFit="cover"
              className="transition-transform duration-300 hover:scale-105"
            />
            <div className="absolute inset-0 bg-black bg-opacity-40 flex items-end">
              <CardHeader className="text-white">
                <CardTitle className="text-3xl font-bold">{insect.title}</CardTitle>
                {insect.latinTitle && (
                  <p className="text-lg italic">{insect.latinTitle}</p>
                )}
              </CardHeader>
            </div>
          </div>
          <CardContent className="p-6">
            {/* <div className="flex flex-wrap gap-2 mb-4">
              {insect.habitat && (
                <Badge variant="secondary">Habitat: {insect.habitat}</Badge>
              )}
              {insect.diet && (
                <Badge variant="secondary">Diet: {insect.diet}</Badge>
              )}
            </div> */}
            <Separator className="my-4" />
            <p className="text-gray-700 leading-relaxed">{insect.description}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default InsectDetails;

