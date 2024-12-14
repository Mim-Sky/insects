import { useInfiniteQuery } from '@tanstack/react-query';
import client from '@/sanityClient';
import { Insect } from '@/sanity/types/types';

const ITEMS_PER_PAGE = 20;

interface FilterParams {
  type: 'order' | 'class';
  value: string;
}

export const useInsectsPaginated = (filter: FilterParams | null) => {
  const fetchInsects = async ({ pageParam = 0 }) => {
    const start = pageParam * ITEMS_PER_PAGE;
    const filterQuery = filter 
      ? `&& ${filter.type}->name == "${filter.value}"`
      : '';
    
    const query = `*[_type == "insect" ${filterQuery}] | order(title asc) [${start}...${start + ITEMS_PER_PAGE}] {
      _id,
      title,
      latinTitle,
      shortDescription,
      image,
      slug,
      "order": order->name,
      "class": order->class->name
    }`;

    return await client.fetch(query);
  };

  const queryKey = filter ? ['insects', filter] : ['insects'];

  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isFetching
  } = useInfiniteQuery<Insect[], unknown>(
    queryKey,
    ({ pageParam }) => fetchInsects({ pageParam }),
    {
      getNextPageParam: (lastPage, allPages) => lastPage.length < ITEMS_PER_PAGE ? undefined : allPages.length,
      staleTime: 1000 * 60 * 60 * 24, // Cache for 24 hours
      refetchOnWindowFocus: false,
    }
  );

  // Flatten the paginated response
  const insects = data ? data.pages.flat() : [];

  return {
    insects,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isFetching
  };
};
