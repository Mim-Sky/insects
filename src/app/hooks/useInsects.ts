import { useMemo } from 'react';
import { useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query';
import client from '@/sanityClient';
import { Insect } from '@/sanity/types/types';

const ITEMS_PER_PAGE = 20;

interface FilterParams {
  type: 'order' | 'class';
  value: string;
}

interface PageParam {
  pageIndex: number;
}

export const queryKeys = {
  insects: ['insects'] as const,
  insectsPaginated: (filter: FilterParams | null) => ['insects', 'paginated', filter] as const,
  insect: (slug: string) => ['insect', slug] as const,
};

export const useAllInsects = () => {
  return useQuery({
    queryKey: queryKeys.insects,
    queryFn: async () => {
      const query = `*[_type == "insect"] | order(title asc) {
        _id,
        title,
        latinTitle,
        shortDescription,
        image,
        slug,
        "order": order->name,
        "class": order->class->name
      }`;
      return client.fetch(query);
    },
    staleTime: 1000 * 60 * 60 * 24,
    gcTime: 1000 * 60 * 60 * 24,
  });
};

export const useInsectsPaginated = (filter: FilterParams | null) => {
  const { data: allInsects = [], isLoading: allInsectsLoading } = useAllInsects();

  // Apply filter to all insects
  const filteredInsects = useMemo(() => {
    return filter
      ? allInsects.filter((insect: { [x: string]: string }) => insect[filter.type] === filter.value)
      : allInsects;
  }, [filter, allInsects]);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: paginationLoading,
  } = useInfiniteQuery({
    queryKey: queryKeys.insectsPaginated(filter),
    queryFn: async ({ pageParam = { pageIndex: 0 } }) => {
      const start = pageParam.pageIndex * ITEMS_PER_PAGE;
      return {
        insects: filteredInsects.slice(start, start + ITEMS_PER_PAGE),
        nextPage: start + ITEMS_PER_PAGE < filteredInsects.length 
          ? { pageIndex: pageParam.pageIndex + 1 }
          : undefined
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: { pageIndex: 0 }, // 🔥 Key fix to TypeScript error
    enabled: !allInsectsLoading,
  });

  const flattenedInsects = useMemo(() => {
    return data?.pages.flatMap(page => page.insects) ?? [];
  }, [data]);

  const totalCount = filteredInsects.length;
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  return {
    insects: flattenedInsects,
    isLoading: allInsectsLoading || paginationLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    totalCount,
    totalPages
  };
};

// Hook for individual insect details remains the same
export const useInsect = (slug: string) => {
  const queryClient = useQueryClient();
  
  return useQuery({
    queryKey: queryKeys.insect(slug),
    queryFn: async () => {
      const query = `*[_type == "insect" && slug.current == $slug][0]{
        title,
        latinTitle,
        description,
        image,
        shortDescription,
        "order": order->name,
        "class": order->class->name
      }`;
      return client.fetch(query, { slug });
    },
    initialData: () => {
      const cachedInsects = queryClient.getQueryData<Insect[]>(queryKeys.insects);
      return cachedInsects?.find(insect => insect.slug.current === slug);
    },
  });
};
