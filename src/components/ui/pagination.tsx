
import * as React from "react"
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react"

import { cn } from "@/lib/utils"
import { ButtonProps, buttonVariants } from "@/components/ui/button"

const Pagination = ({ className, ...props }: React.ComponentProps<"nav">) => (
  <nav
    role="navigation"
    aria-label="pagination"
    className={cn("mx-auto flex w-full justify-center", className)}
    {...props}
  />
)
Pagination.displayName = "Pagination"

const PaginationContent = React.forwardRef<
  HTMLUListElement,
  React.ComponentProps<"ul">
>(({ className, ...props }, ref) => (
  <ul
    ref={ref}
    className={cn("flex flex-row items-center gap-1", className)}
    {...props}
  />
))
PaginationContent.displayName = "PaginationContent"

const PaginationItem = React.forwardRef<
  HTMLLIElement,
  React.ComponentProps<"li">
>(({ className, ...props }, ref) => (
  <li ref={ref} className={cn("", className)} {...props} />
))
PaginationItem.displayName = "PaginationItem"

type PaginationLinkProps = {
  isActive?: boolean
} & Pick<ButtonProps, "size"> &
  React.ComponentProps<"a">

const PaginationLink = ({
  className,
  isActive,
  size = "icon",
  ...props
}: PaginationLinkProps) => (
  <a
    aria-current={isActive ? "page" : undefined}
    className={cn(
      buttonVariants({
        variant: isActive ? "outline" : "ghost",
        size,
      }),
      className
    )}
    {...props}
  />
)
PaginationLink.displayName = "PaginationLink"

const PaginationPrevious = ({
  className,
  ...props
}: React.ComponentProps<typeof PaginationLink>) => (
  <PaginationLink
    aria-label="Go to previous page"
    size="default"
    className={cn("gap-1 pl-2.5", className)}
    {...props}
  >
    <ChevronLeft className="h-4 w-4" />
    <span>Previous</span>
  </PaginationLink>
)
PaginationPrevious.displayName = "PaginationPrevious"

const PaginationNext = ({
  className,
  ...props
}: React.ComponentProps<typeof PaginationLink>) => (
  <PaginationLink
    aria-label="Go to next page"
    size="default"
    className={cn("gap-1 pr-2.5", className)}
    {...props}
  >
    <span>Next</span>
    <ChevronRight className="h-4 w-4" />
  </PaginationLink>
)
PaginationNext.displayName = "PaginationNext"

const PaginationEllipsis = ({
  className,
  ...props
}: React.ComponentProps<"span">) => (
  <span
    aria-hidden
    className={cn("flex h-9 w-9 items-center justify-center", className)}
    {...props}
  >
    <MoreHorizontal className="h-4 w-4" />
    <span className="sr-only">More pages</span>
  </span>
)
PaginationEllipsis.displayName = "PaginationEllipsis"

// Improved pagination range generation for very large datasets
const generatePaginationItems = (currentPage: number, totalPages: number): (number | string)[] => {
  // For very large datasets, we need a more sophisticated approach
  const items: (number | string)[] = [];
  
  // For massive datasets, use a dynamic window approach
  if (totalPages <= 1) {
    return [1]; // Only one page
  }
  
  // Always show first page
  items.push(1);
  
  // Determine the range of pages to show around current page
  let rangeStart = Math.max(2, currentPage - 2);
  let rangeEnd = Math.min(totalPages - 1, currentPage + 2);
  
  // Adjust range to always show 5 pages if possible
  if (rangeEnd - rangeStart < 4) {
    if (currentPage < totalPages / 2) {
      // Near the start, extend end
      rangeEnd = Math.min(totalPages - 1, rangeStart + 4);
    } else {
      // Near the end, extend start
      rangeStart = Math.max(2, rangeEnd - 4);
    }
  }
  
  // Add ellipsis between 1 and rangeStart if needed
  if (rangeStart > 2) {
    items.push("ellipsis");
  } else if (rangeStart === 2) {
    items.push(2); // No need for ellipsis, just show 2
  }
  
  // Add the pages in range
  for (let i = rangeStart; i <= rangeEnd; i++) {
    if (i !== 1 && i !== totalPages) { // Skip 1 and totalPages as they're handled separately
      items.push(i);
    }
  }
  
  // Add ellipsis between rangeEnd and totalPages if needed
  if (rangeEnd < totalPages - 1) {
    items.push("ellipsis");
  } else if (rangeEnd === totalPages - 1) {
    items.push(totalPages - 1); // No need for ellipsis
  }
  
  // Always show last page if more than 1 page
  if (totalPages > 1) {
    items.push(totalPages);
  }
  
  return items;
};

export {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  generatePaginationItems
}
