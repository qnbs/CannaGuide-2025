import React, { memo } from 'react'
import DOMPurify from 'dompurify'

interface SafeHtmlProps {
    html: string
    className?: string
}

/**
 * Renders sanitized HTML content using DOMPurify to prevent XSS.
 * Use this instead of bare dangerouslySetInnerHTML for all AI-generated
 * or user-editable content.
 */
export const SafeHtml: React.FC<SafeHtmlProps> = memo(({ html, className }) => (
    <div
        className={className}
        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(html) }}
    />
))

SafeHtml.displayName = 'SafeHtml'
