'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
    DocumentTextIcon,
    ChevronRightIcon,
    Bars3Icon,
    XMarkIcon,
    ChevronUpIcon,
    ChevronDownIcon,
    DocumentDuplicateIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '@/lib/auth-context';
import Logo from '@/components/Logo';

interface DocItem {
    id: string;
    title: string;
    category: string;
}

interface TocItem {
    level: number;
    text: string;
    id: string;
}

interface DocContent {
    id: string;
    title: string;
    category: string;
    content: string;
    toc: TocItem[];
}

interface Categories {
    [key: string]: DocItem[];
}

// Helper component for code blocks with copy button
function CodeBlockWithCopy({ children }: { children: React.ReactNode }) {
    const [copied, setCopied] = useState(false);
    const codeRef = useRef<HTMLPreElement>(null);

    const handleCopy = () => {
        const text = codeRef.current?.innerText || '';
        navigator.clipboard.writeText(text).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    return (
        <div className="relative group">
            <pre className="bg-gray-50! text-gray-900! border! border-gray-200! rounded-lg! p-4! overflow-x-auto! mb-4! text-sm!" ref={codeRef}>
                {children}
            </pre>
            <button
                onClick={handleCopy}
                className="absolute top-2 right-2 p-1.5 rounded bg-gray-200 hover:bg-gray-300 text-gray-700 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                title="Copy code"
            >
                <DocumentDuplicateIcon className="h-4 w-4" />
            </button>
            {copied && (
                <span className="absolute top-2 right-12 text-xs text-green-600 font-medium whitespace-nowrap">Copied!</span>
            )}
        </div>
    );
}

export default function DocumentationPage() {
    const { user, loading: authLoading } = useAuth();
    const [docs, setDocs] = useState<DocItem[]>([]);
    const [categories, setCategories] = useState<Categories>({});
    const [selectedDoc, setSelectedDoc] = useState<DocContent | null>(null);
    const [loading, setLoading] = useState(true);
    const [docLoading, setDocLoading] = useState(false);
    const [activeHeading, setActiveHeading] = useState<string>('');
    const [showScrollTop, setShowScrollTop] = useState(false);
    const [openDropdown, setOpenDropdown] = useState<string | null>(null);
    const [expandedTocSections, setExpandedTocSections] = useState<Set<string>>(new Set(['h2']));
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Category display names mapping
    const categoryDisplayNames: Record<string, string> = {
        'Architecture': 'Architecture Guides',
        'Operational Guides': 'Operational Guides'
    };

    // Get consistent document display title
    const getDocDisplayTitle = (doc: DocItem): string => {
        if (doc.category === 'Architecture') {
            // Extract the part after "Architecture - " or use title as is
            if (doc.title.startsWith('Architecture - ')) {
                return `Architecture Guide - ${doc.title.substring('Architecture - '.length)}`;
            }
            return `Architecture Guide - ${doc.title}`;
        } else if (doc.category === 'Operational Guides') {
            // Handle "Operational Guide - Admin" -> "Operational Guide - Admin Panel"
            if (doc.title === 'Operational Guide - Admin') {
                return 'Operational Guide - Admin Panel';
            }
            // If already has full name, keep it
            if (doc.title.startsWith('Operational Guide - ')) {
                return doc.title;
            }
            return `Operational Guide - ${doc.title}`;
        }
        return doc.title;
    };

    // Fetch docs list
    useEffect(() => {
        fetchDocsList();
    }, []);

    // Handle click outside dropdown
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setOpenDropdown(null);
            }
        };

        if (openDropdown) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [openDropdown]);

    // Track scroll position for active heading and scroll-to-top button
    useEffect(() => {
        const handleScroll = () => {
            // Show scroll to top button
            setShowScrollTop(window.scrollY > 500);

            // Track active heading
            if (selectedDoc?.toc) {
                const headings = selectedDoc.toc
                    .filter(t => t.level <= 2)
                    .map(t => document.getElementById(t.id))
                    .filter(Boolean) as HTMLElement[];

                for (let i = headings.length - 1; i >= 0; i--) {
                    const heading = headings[i];
                    const rect = heading.getBoundingClientRect();
                    if (rect.top <= 120) {
                        setActiveHeading(heading.id);
                        break;
                    }
                }
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [selectedDoc]);

    const fetchDocsList = async () => {
        try {
            const response = await fetch('/api/docs');
            const data = await response.json();
            if (data.success) {
                setDocs(data.docs);
                setCategories(data.categories);
                // Don't auto-select any doc - user will choose from landing page
            }
        } catch (error) {
            console.error('Error fetching docs list:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchDoc = async (docId: string) => {
        setDocLoading(true);
        setOpenDropdown(null);
        try {
            const response = await fetch(`/api/docs?id=${docId}`);
            const data = await response.json();
            if (data.success) {
                setSelectedDoc(data.doc);
                // Scroll to top when changing docs
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        } catch (error) {
            console.error('Error fetching doc:', error);
        } finally {
            setDocLoading(false);
        }
    };

    const scrollToHeading = useCallback((headingId: string) => {
        const element = document.getElementById(headingId);
        if (element) {
            const offset = 100;
            const elementPosition = element.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - offset;
            window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
        }
    }, []);

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    if (authLoading || loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white flex flex-col" style={{ paddingTop: '64px' }}>
            {/* Top Header with Dropdown Navigation */}
            <div className="fixed top-0 left-0 right-0 z-50 bg-black border-b border-gray-900">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        {/* Logo and Title */}
                        <div className="flex items-center gap-3">
                            <Logo className="h-8 w-auto" width={100} height={32} />
                            <span className="text-gray-600">|</span>
                            <h1 className="text-xl font-bold text-white">Documentation</h1>
                        </div>

                        {/* Dropdowns */}
                        <div className="flex items-center gap-2" ref={dropdownRef}>
                            {Object.entries(categories).map(([category, categoryDocs]) => (
                                <div 
                                    key={category} 
                                    className="relative"
                                    onMouseEnter={() => setOpenDropdown(category)}
                                    onMouseLeave={() => setOpenDropdown(null)}
                                >
                                    <button
                                        className="px-3 py-2 rounded-lg text-sm font-medium text-gray-200 hover:text-white hover:bg-gray-800 flex items-center gap-1.5 transition-all duration-200"
                                    >
                                        {categoryDisplayNames[category] || category}
                                        <ChevronDownIcon className={`h-4 w-4 transition-transform duration-200 ${openDropdown === category ? 'rotate-180' : ''}`} />
                                    </button>

                                    {/* Dropdown Menu */}
                                    <div 
                                        className={`absolute top-full left-0 mt-0 w-64 bg-white border border-gray-200 rounded-lg shadow-xl py-2 z-50 origin-top transition-all duration-150 ease-out ${
                                            openDropdown === category 
                                                ? 'opacity-100 scale-y-100 visible' 
                                                : 'opacity-0 scale-y-95 invisible pointer-events-none'
                                        }`}
                                        style={{
                                            transformOrigin: 'top',
                                            transform: openDropdown === category ? 'scaleY(1)' : 'scaleY(0.95)',
                                        }}
                                    >
                                        {categoryDocs.map((doc) => (
                                            <button
                                                key={doc.id}
                                                onClick={() => fetchDoc(doc.id)}
                                                className={`
                                                    w-full text-left px-4 py-2.5 text-sm transition-colors duration-150
                                                    flex items-center gap-2
                                                    ${selectedDoc?.id === doc.id
                                                        ? 'bg-gray-100/60 text-gray-900 font-medium'
                                                        : 'text-gray-700 hover:bg-gray-50'
                                                    }
                                                `}
                                            >
                                                {doc.title}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Left Sidebar - Table of Contents */}
            <aside className="hidden lg:block fixed left-0 top-16 w-72 h-[calc(100vh-4rem)] bg-white border-r border-gray-200 overflow-y-auto z-30">
                {selectedDoc?.toc && (
                    <div>
                        <div className="sticky top-0 bg-white p-4 border-b border-gray-200 z-10">
                            <h3 className="font-semibold text-gray-900 text-base">Table of Contents</h3>
                        </div>
                        <nav className="p-4 space-y-2">
                        {selectedDoc.toc
                            .filter(item => item.level >= 2 && item.level <= 3)
                            .reduce((acc, item) => {
                                if (item.level === 2) {
                                    acc.push({ ...item, children: [] });
                                } else if (acc.length > 0) {
                                    acc[acc.length - 1].children.push(item);
                                }
                                return acc;
                            }, [] as any[])
                            .map((section, index) => (
                                <div key={index}>
                                    <button
                                        onClick={() => {
                                            if (section.children.length > 0) {
                                                setExpandedTocSections(prev => {
                                                    const next = new Set(prev);
                                                    if (next.has(section.id)) {
                                                        next.delete(section.id);
                                                    } else {
                                                        next.add(section.id);
                                                    }
                                                    return next;
                                                });
                                            } else {
                                                scrollToHeading(section.id);
                                            }
                                        }}
                                        className={`
                                            w-full text-left text-xs py-2 px-2 rounded transition-colors duration-150 flex items-center justify-between
                                            font-semibold
                                            ${activeHeading === section.id
                                                ? 'bg-black/5 text-black'
                                                : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                                            }
                                        `}
                                    >
                                        <span className="line-clamp-2 flex-1">{section.text}</span>
                                        {section.children.length > 0 && (
                                            <ChevronDownIcon className={`h-3 w-3 shrink-0 transition-transform duration-200 ${expandedTocSections.has(section.id) ? 'rotate-180' : ''}`} />
                                        )}
                                    </button>
                                    {expandedTocSections.has(section.id) && section.children.length > 0 && (
                                        <div className="mt-1 space-y-1 border-l border-gray-200 ml-2 pl-2">
                                            {section.children.map((child: TocItem, cIndex: number) => (
                                                <button
                                                    key={cIndex}
                                                    onClick={() => scrollToHeading(child.id)}
                                                    className={`
                                                        w-full text-left text-xs py-1 px-2 rounded transition-colors duration-150
                                                        ${activeHeading === child.id
                                                            ? 'bg-black/5 text-black font-medium'
                                                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                                        }
                                                    `}
                                                >
                                                    <span className="line-clamp-2">{child.text}</span>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </nav>
                    </div>
                )}
            </aside>

            {/* Main Content */}
            <main className={`pt-16 flex-1 ${selectedDoc ? 'lg:ml-72' : ''}`}>
                {docLoading ? (
                    <div className="flex items-center justify-center min-h-[60vh]">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
                    </div>
                ) : selectedDoc ? (
                    <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                        <div className="mb-8 flex items-center gap-2 text-sm text-gray-500">
                            <span className="text-gray-600 font-medium">Documentation</span>
                            <ChevronRightIcon className="h-3 w-3" />
                            <span>{selectedDoc.category}</span>
                            <ChevronRightIcon className="h-3 w-3" />
                            <span className="text-gray-900 font-medium">{selectedDoc.title}</span>
                        </div>

                        {/* Markdown Content */}
                        <div className="prose prose-lg prose-gray max-w-none prose-code:bg-gray-50 prose-code:text-gray-900 prose-pre:bg-gray-50 prose-pre:text-gray-900">
                            <ReactMarkdown
                                remarkPlugins={[remarkGfm]}
                                components={{
                                    h1: ({ children, ...props }) => {
                                        const id = String(children)
                                            .toLowerCase()
                                            .replace(/[^a-z0-9\s-]/g, '')
                                            .replace(/\s+/g, '-');
                                        return <h1 id={id} className="text-4xl font-bold mt-8 mb-4 text-black" {...props}>{children}</h1>;
                                    },
                                    h2: ({ children, ...props }) => {
                                        const id = String(children)
                                            .toLowerCase()
                                            .replace(/[^a-z0-9\s-]/g, '')
                                            .replace(/\s+/g, '-');
                                        return <h2 id={id} className="text-3xl font-bold mt-7 mb-3 text-black" {...props}>{children}</h2>;
                                    },
                                    h3: ({ children, ...props }) => {
                                        const id = String(children)
                                            .toLowerCase()
                                            .replace(/[^a-z0-9\s-]/g, '')
                                            .replace(/\s+/g, '-');
                                        return <h3 id={id} className="text-2xl font-semibold mt-6 mb-3 text-black" {...props}>{children}</h3>;
                                    },
                                    h4: ({ children, ...props }) => {
                                        const id = String(children)
                                            .toLowerCase()
                                            .replace(/[^a-z0-9\s-]/g, '')
                                            .replace(/\s+/g, '-');
                                        return <h4 id={id} className="text-xl font-semibold mt-5 mb-2 text-black" {...props}>{children}</h4>;
                                    },
                                    h5: ({ children, ...props }) => {
                                        const id = String(children)
                                            .toLowerCase()
                                            .replace(/[^a-z0-9\s-]/g, '')
                                            .replace(/\s+/g, '-');
                                        return <h5 id={id} className="text-lg font-semibold mt-4 mb-2 text-gray-900" {...props}>{children}</h5>;
                                    },
                                    h6: ({ children, ...props }) => {
                                        const id = String(children)
                                            .toLowerCase()
                                            .replace(/[^a-z0-9\s-]/g, '')
                                            .replace(/\s+/g, '-');
                                        return <h6 id={id} className="text-base font-semibold mt-3 mb-2 text-gray-800" {...props}>{children}</h6>;
                                    },
                                    a: ({ href, children, ...props }) => {
                                        // Handle anchor links
                                        if (href?.startsWith('#')) {
                                            return (
                                                <a
                                                    href={href}
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        const sectionId = href.substring(1);
                                                        scrollToHeading(sectionId);
                                                    }}
                                                    className="text-blue-600 hover:text-blue-800 underline cursor-pointer"
                                                    {...props}
                                                >
                                                    {children}
                                                </a>
                                            );
                                        }
                                        // Handle external links
                                        return (
                                            <a
                                                href={href}
                                                className="text-blue-600 hover:text-blue-800 underline"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                {...props}
                                            >
                                                {children}
                                            </a>
                                        );
                                    },
                                    code: ({ className, children, ...props }) => {
                                        const isInline = !className;
                                        if (isInline) {
                                            return (
                                                <code className="px-1.5! py-0.5! bg-gray-100! text-gray-800! rounded! text-sm! font-mono!" {...props}>
                                                    {children}
                                                </code>
                                            );
                                        }
                                        return (
                                            <code className="bg-gray-50! text-gray-900!" {...props}>
                                                {children}
                                            </code>
                                        );
                                    },
                                    pre: ({ children, ...props }) => (
                                        <CodeBlockWithCopy {...props}>
                                            {children}
                                        </CodeBlockWithCopy>
                                    ),
                                }}
                            >
                                {selectedDoc.content}
                            </ReactMarkdown>
                        </div>

                        {/* Navigation footer */}
                        <div className="mt-12 pt-6 border-t border-gray-200">
                            <div className="flex items-center justify-between">
                                {getPrevDoc() && (
                                    <button
                                        onClick={() => fetchDoc(getPrevDoc()!.id)}
                                        className="flex items-center gap-2 text-sm text-gray-600 hover:text-black"
                                    >
                                        <ChevronRightIcon className="h-4 w-4 rotate-180" />
                                        <span>{getPrevDoc()!.title}</span>
                                    </button>
                                )}
                                <div className="flex-1" />
                                {getNextDoc() && (
                                    <button
                                        onClick={() => fetchDoc(getNextDoc()!.id)}
                                        className="flex items-center gap-2 text-sm text-gray-600 hover:text-black"
                                    >
                                        <span>{getNextDoc()!.title}</span>
                                        <ChevronRightIcon className="h-4 w-4" />
                                    </button>
                                )}
                            </div>
                        </div>
                    </article>
                ) : (
                    <div className="w-full flex items-center justify-center py-12">
                        <div className="w-full max-w-6xl px-4 sm:px-6 lg:px-8">
                            {/* Landing Page Header */}
                            <div className="mb-12 text-center">
                                <h2 className="text-4xl font-bold text-black mb-3">Documentation</h2>
                                <p className="text-lg text-gray-600">Select a guide to get started</p>
                            </div>
                            
                            {/* 2x2 Grid of Documents */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                                {docs.slice(0, 4).map((doc) => (
                                    <button
                                        key={doc.id}
                                        onClick={() => fetchDoc(doc.id)}
                                        className="group p-6 bg-white border-2 border-gray-200 rounded-lg hover:border-black hover:shadow-lg transition-all duration-200 text-left"
                                    >
                                        <div className="flex items-start gap-4">
                                            <div className="p-3 bg-gray-100 rounded-lg group-hover:bg-black transition-colors duration-200">
                                                <DocumentTextIcon className="h-6 w-6 text-gray-700 group-hover:text-white transition-colors duration-200" />
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="text-lg font-bold text-black mb-2 group-hover:text-gray-800">{getDocDisplayTitle(doc)}</h3>
                                                <p className="text-sm text-gray-600 mb-3 group-hover:text-gray-700">
                                                    {doc.category}
                                                </p>
                                                <div className="inline-block text-sm font-medium text-black group-hover:translate-x-1 transition-transform duration-200">
                                                    View Guide →
                                                </div>
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>

                            {/* Additional Info */}
                            {docs.length > 4 && (
                                <div className="mt-12 text-center">
                                    <p className="text-gray-600 mb-4">
                                        {docs.length - 4} more guides available in the navigation menu above
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </main>

            {/* Scroll to top button */}
            {showScrollTop && (
                <button
                    onClick={scrollToTop}
                    className="fixed bottom-6 right-6 p-3 bg-black text-white rounded-full shadow-lg hover:bg-gray-800 transition-colors z-40"
                    aria-label="Scroll to top"
                >
                    <ChevronUpIcon className="h-5 w-5" />
                </button>
            )}
        </div>
    );

    function getPrevDoc(): DocItem | undefined {
        if (!selectedDoc) return undefined;
        const currentIndex = docs.findIndex(d => d.id === selectedDoc.id);
        return currentIndex > 0 ? docs[currentIndex - 1] : undefined;
    }

    function getNextDoc(): DocItem | undefined {
        if (!selectedDoc) return undefined;
        const currentIndex = docs.findIndex(d => d.id === selectedDoc.id);
        return currentIndex < docs.length - 1 ? docs[currentIndex + 1] : undefined;
    }
}
