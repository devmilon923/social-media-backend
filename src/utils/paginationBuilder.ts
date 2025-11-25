export default function paginationBuilder({
  totalData,
  currentPage,
  limit,
}: {
  totalData: number;
  currentPage: number;
  limit: number;
}): {
  totalPage: number;
  currentPage: number;
  prevPage: number | 0;
  nextPage: number | 0;
  totalData: number;
} {
  const totalPage = Math.ceil(totalData / limit) || 1;
  const prevPage = currentPage - 1 > 0 ? currentPage - 1 : 0;
  const nextPage = currentPage + 1 <= totalPage ? currentPage + 1 : 0;

  return {
    totalPage,
    currentPage,
    prevPage,
    nextPage,
    totalData,
  };
}
