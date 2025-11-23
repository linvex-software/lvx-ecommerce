'use client'

import { useState, useEffect } from 'react'
import { Search, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

interface SearchBarProps {
    onSearch: (query: string) => void
    placeholder?: string
    initialValue?: string
}

const SearchBar = ({ onSearch, placeholder = 'Buscar produtos...', initialValue = '' }: SearchBarProps) => {
    const [query, setQuery] = useState(initialValue)
    const [debouncedQuery, setDebouncedQuery] = useState(initialValue)

    // Debounce search query
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedQuery(query)
        }, 300)

        return () => clearTimeout(timer)
    }, [query])

    // Trigger search when debounced query changes
    useEffect(() => {
        onSearch(debouncedQuery)
    }, [debouncedQuery, onSearch])

    const handleClear = () => {
        setQuery('')
        setDebouncedQuery('')
    }

    return (
        <div className="relative w-full max-w-2xl">
            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={placeholder}
                    className="pl-12 pr-12 h-12 text-base border-2 focus:border-foreground transition-colors"
                />
                {query && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleClear}
                        className="absolute right-2 top-1/2 -translate-y-1/2 hover:bg-secondary"
                    >
                        <X className="w-4 h-4" />
                    </Button>
                )}
            </div>
            {debouncedQuery && (
                <p className="text-xs text-muted-foreground mt-2">
                    Buscando por: <span className="font-semibold text-foreground">{debouncedQuery}</span>
                </p>
            )}
        </div>
    )
}

export default SearchBar
