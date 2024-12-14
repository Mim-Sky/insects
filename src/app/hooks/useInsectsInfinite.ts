import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import client from '@/sanityClient';
import { Insect } from '@/sanity/types/types';

const ITEMS_PER_PAGE = 20;

interface FilterParams {
  type: 'order' | 'class';
  value: string;
}

export const queryKeys = {
  insects: ['insects'],
  insect: (slug: string) => ['insect', slug],
  insectsInfinite: (filter: FilterParams | null) => ['insects-infinite', filter],
};

const fetchInsectsPage = async ({ pageParam = 0, filter }: { pageParam?: number; filter: FilterParams | null }) => {
  const start = pageParam * ITEMS_PER_PAGE;
  let filterQuery = '';

  if (filter && filter.type && filter.value) {
    filterQuery = `&& ${filter.type} == "${filter.value}"`;
  }

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

  return client.fetch<Insect[]>(query);
};

export const useInsectsInfinite = (filter: FilterParams | null) => {
  const queryClient = useQueryClient();

  // Define generics:
  // TQueryFnData = Insect[]
  // TError = Error
  // TData = Insect[] (same as TQueryFnData here)
  // TQueryKey = ["insects-infinite", FilterParams | null]
  // TPageParam = number (since we use page numbers)
  return useInfiniteQuery({
    queryKey: queryKeys.insectsInfinite(filter),
    queryFn: ({ pageParam = 0 }) => fetchInsectsPage({ pageParam, filter }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.length < ITEMS_PER_PAGE) return undefined;
      return allPages.length;
    },
    staleTime: 1000 * 60 * 60 * 24,
    initialData: () => {
        const cachedInsects = queryClient.getQueryData<Insect[]>(['insects']);
        if (!cachedInsects || cachedInsects.length === 0) {
          return undefined; // no initial data, trigger a fetch
        }
      const firstPage = cachedInsects.slice(0, ITEMS_PER_PAGE);
      return {
        pages: [firstPage],
        pageParams: [0],
      };
    }
  });
  
};