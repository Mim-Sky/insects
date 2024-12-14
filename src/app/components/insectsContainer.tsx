'use client';

import { useState, useEffect } from 'react';
import { useInsectsPaginated } from "../hooks/useInsects";
import { useTaxonomies } from "../hooks/useTaxonomies";
import Card from './ui/card';
import { FilterDrawer } from './FilterDrawer';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { urlFor } from '@/sanityClient';
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ChevronRight } from 'lucide-react';
import { ImSpinner2 } from "react-icons/im";

const Insects = () => {
  const [activeFilter, setActiveFilter] = useState<{ type: 'order' | 'class', value: string } | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  console.log('Component render: Insects');

  const {
    insects,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    totalCount,
  } = useInsectsPaginated(activeFilter);

  console.log('useInsectsPaginated hook state:', { insects, isLoading, isFetchingNextPage, hasNextPage, totalCount });

  const { data: taxonomies = { orders: [], classes: [] }, isLoading: taxonomiesLoading } = useTaxonomies();
  console.log('useTaxonomies hook state:', { taxonomies, taxonomiesLoading });

  useEffect(() => {
    console.log('Effect: Attaching popstate listener');
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const filterType = params.get('type') as 'order' | 'class';
      const filterValue = params.get('value');
      
      console.log('Popstate params:', { filterType, filterValue });
      
      if (filterType && filterValue) {
        console.log('Popstate filter set:', { type: filterType, value: filterValue });
        setActiveFilter({ type: filterType, value: filterValue });
      } else {
        console.log('Popstate cleared filter');
        setActiveFilter(null);
      }
    };

    window.addEventListener('popstate', handlePopState);
    handlePopState(); // Initial sync with URL

    return () => {
      console.log('Effect cleanup: Removing popstate listener');
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  const handleFilterChange = (type: 'order' | 'class', value: string | null) => {
    console.log('Filter change requested:', { type, value });
    const params = new URLSearchParams(window.location.search);
    
    if (value === null) {
      console.log('Clearing filter');
      params.delete('type');
      params.delete('value');
      setActiveFilter(null);
    } else {
      console.log('Setting filter', { type, value });
      params.set('type', type);
      params.set('value', value);
      setActiveFilter({ type, value });
    }

    console.log('Updated URL params:', params.toString());
    window.history.replaceState({}, '', `${window.location.pathname}?${params.toString()}`);
  };

  return (
    <div className="flex h-screen">
      <Sheet open={isDrawerOpen} onOpenChange={(open) => { console.log('Sheet state changed:', open); setIsDrawerOpen(open); }}>
        <SheetTrigger asChild>
          <Button 
            variant="outline" 
            className="fixed left-4 top-4 z-10 lg:hidden"
            aria-label="Open filters"
          >
            <ChevronRight className="h-4 w-4 mr-2" />
            Filters
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0 w-80">
          <FilterDrawer 
            taxonomies={taxonomies} 
            onFilterChange={handleFilterChange} 
            activeFilter={activeFilter} 
            onClose={() => { console.log('Drawer closed'); setIsDrawerOpen(false); }} 
            isMobileDrawer={true} 
          />
        </SheetContent>
      </Sheet>
  
      <div className="hidden lg:block">
        <FilterDrawer 
          taxonomies={taxonomies} 
          onFilterChange={handleFilterChange} 
          activeFilter={activeFilter} 
          onClose={() => { console.log('Desktop drawer closed'); }} 
          isMobileDrawer={false} 
        />
      </div>
      
      <ScrollArea className="flex-1 p-6">
        <h1 className="text-3xl font-bold mb-6">Discover insects & spiders</h1>
        {activeFilter && (
          <div className="mb-4">
            <span className="font-semibold">Active Filter:</span> {activeFilter.type} - {activeFilter.value}
            <span className="ml-4 text-gray-600">
              {totalCount} {totalCount === 1 ? 'result' : 'results'}
            </span>
          </div>
        )}
        
        {isLoading || taxonomiesLoading ? (
          <div className='flex justify-center'>
            <ImSpinner2 className='text-[#deecfa] animate-spin w-8 h-8'/>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {insects.map((insect) => (
                console.log('Rendering insect card:', insect),
                <Card
                  key={insect._id}
                  imageUrl={insect.image ? urlFor(insect.image).width(330).height(330).url() : '/zombie.webp'}
                  title={insect.title}
                  latinTitle={insect.latinTitle}
                  shortDescription={insect.shortDescription}
                  slug={insect.slug.current}
                />
              ))}
            </div>
            
            {hasNextPage && (
              <div className="mt-8 flex justify-center">
                <Button
                  onClick={() => { console.log('Fetching next page'); fetchNextPage(); }}
                  variant="outline"
                  disabled={isFetchingNextPage}
                >
                  {isFetchingNextPage ? 'Loading more...' : `Show More (${insects.length}/${totalCount})`}
                </Button>
              </div>
            )}
          </>
        )}
      </ScrollArea>
    </div>
  );
};
  
export default Insects;
