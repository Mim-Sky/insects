'use client'

import { useState } from 'react';
import client, { urlFor } from "@/sanityClient";
import { Insect } from "@/sanity/types/types";
import Image from "next/image";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { ChevronDownIcon, ChevronUpIcon } from 'lucide-react';

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

const InsectDescription = ({ description }: { description: string }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div>
      <p className={`text-gray-700 leading-relaxed ${isExpanded ? '' : 'line-clamp-3'}`}>
        {description}
      </p>
      <Button
        variant="ghost"
        className="mt-2 p-0 h-auto font-semibold text-primary"
        onClick={toggleExpand}
      >
        {isExpanded ? (
          <>
            Show less
            <ChevronUpIcon className="ml-1 h-4 w-4" />
          </>
        ) : (
          <>
            Show more
            <ChevronDownIcon className="ml-1 h-4 w-4" />
          </>
        )}
      </Button>
    </div>
  );
};

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
      scientificName,
      habitat,
      diet
    }`,
    { slug }
  );

  if (!insect) {
    return <div className="text-center p-8 text-2xl text-red-600">404 - Insect Not Found</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-green-100 py-8">
      <div className="container mx-auto px-4">
        <Card className="overflow-hidden shadow-xl">
          <div className="flex flex-col md:flex-row">
            {/* Left column: Photo */}
            <div className="md:w-1/2">
              <div className="relative h-64 sm:h-80 md:h-full">
                <Image
                  src={urlFor(insect.image).url()}
                  alt={insect.title}
                  layout="fill"
                  objectFit="cover"
                  className="transition-transform duration-300 hover:scale-105"
                />
              </div>
            </div>

            {/* Right column: Text content */}
            <div className="md:w-1/2 p-6">
              <h1 className="text-3xl font-bold mb-2">{insect.title}</h1>
              {insect.latinTitle && (
                <p className="text-lg italic text-gray-600 mb-4">{insect.latinTitle}</p>
              )}
              <div className="flex flex-wrap gap-2 mb-4">
                
                  <Badge variant="secondary">Habitat: Drzewa</Badge>
                
                
                  <Badge variant="secondary">Diet: Gruz</Badge>
                
              </div>
              <Separator className="my-4" />
              <InsectDescription description={insect.description} />
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default InsectDetails;

