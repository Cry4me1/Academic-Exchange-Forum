export type AnnotationColor = "amber" | "emerald" | "sky" | "violet";

export interface AnnotationAuthor {
    id: string;
    username: string;
    avatar_url?: string;
    bio?: string;
    vip_level?: number | null;
    reputation_score?: number;
    is_developer?: boolean;
    developer_title?: string;
    special_title?: string | null;
    badges?: string[] | null;
    is_verified?: boolean;
    auth_provider?: string;
}

export interface PostAnnotation {
    id: string;
    post_id: string;
    author_id: string;
    parent_id?: string | null;
    anchor_text: string;
    anchor_prefix: string;
    anchor_suffix: string;
    content: string;
    color: AnnotationColor;
    is_resolved: boolean;
    review_status?: string;
    created_at: string;
    updated_at: string;
    author: AnnotationAuthor;
    replies?: PostAnnotation[];
}

export interface CreateAnnotationParams {
    postId: string;
    anchorText: string;
    anchorPrefix?: string;
    anchorSuffix?: string;
    content: string;
    color?: AnnotationColor;
}

export interface AnnotationSelectionState {
    anchorText: string;
    anchorPrefix: string;
    anchorSuffix: string;
    rect: {
        top: number;
        left: number;
        width: number;
        height: number;
    };
}
