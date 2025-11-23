'use client'

import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface PaginationProps {
    currentPage: number
    totalPages: number
    onPageChange: (page: number) => void
    itemsPerPage: number
    totalItems: number
}

const Pagination = ({
    currentPage,
    totalPages,
    onPageChange,
    itemsPerPage,
    totalItems,
}: PaginationProps) => {
    const startItem = (currentPage - 1) * itemsPerPage + 1
    const endItem = Math.min(currentPage * itemsPerPage, totalItems)

    const getPageNumbers = () => {
        const pages: (number | string)[] = []
        const maxVisible = 5

        if (totalPages <= maxVisible) {
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i)
            }
        } else {
            if (currentPage <= 3) {
                for (let i = 1; i <= 4; i++) {
                    pages.push(i)
                }
                pages.push('...')
                pages.push(totalPages)
            } else if (currentPage >= totalPages - 2) {
                pages.push(1)
                pages.push('...')
                for (let i = totalPages - 3; i <= totalPages; i++) {
                    pages.push(i)
                }
            } else {
                pages.push(1)
                pages.push('...')
                pages.push(currentPage - 1)
                pages.push(currentPage)
                pages.push(currentPage + 1)
                pages.push('...')
                pages.push(totalPages)
            }
        }

        return pages
    }

    if (totalPages <= 1) return null

    return (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-12 pt-8 border-t border-border">
            <p className="text-sm text-muted-foreground">
                Mostrando <span className="font-semibold text-foreground">{startItem}</span> até{' '}
                <span className="font-semibold text-foreground">{endItem}</span> de{' '}
                <span className="font-semibold text-foreground">{totalItems}</span> produtos
            </p>

            <div className="flex items-center gap-2">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="border-2"
                >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Anterior
                </Button>

                <div className="flex gap-1">
                    {getPageNumbers().map((page, index) => (
                        <div key={index}>
                            {page === '...' ? (
                                <span className="px-3 py-2 text-muted-foreground">...</span>
                            ) : (
                                <Button
                                    variant={currentPage === page ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => onPageChange(page as number)}
                                    className={`min-w-[40px] border-2 ${currentPage === page
                                            ? 'bg-foreground text-background border-foreground'
                                            : 'border-border hover:border-foreground'
                                        }`}
                                >
                                    {page}
                                </Button>
                            )}
                        </div>
                    ))}
                </div>

                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="border-2"
                >
                    Próxima
                    <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
            </div>
        </div>
    )
}

export default Pagination
