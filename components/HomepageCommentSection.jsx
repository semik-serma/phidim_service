"use client";

import { useState, useEffect, useRef } from "react";
import { FaWandMagicSparkles } from "react-icons/fa6";
import {
  ThumbsUp,
  ThumbsDown,
  Share2,
  Check,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  CornerDownRight,
  Plus,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { fetchNewestDjangoArticle } from "@/services/articleService";
import { triggerBackendWarning, BACKEND_READY, handleUnauthenticatedLike } from "@/lib/backendWarning";
import {
  fetchDjangoComments,
  postDjangoComment,
  postDjangoReply,
  likeDjangoComment,
} from "@/services/commentService";

export function HomepageCommentSection() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const inputRef = useRef(null);

  const activeLang = "Nepali";
  const [comments, setComments] = useState([]);
  const [article, setArticle] = useState(null);
  const [articleStatus, setArticleStatus] = useState("loading");
  const [reloadKey, setReloadKey] = useState(0);
  const [imageFailed, setImageFailed] = useState(false);
  const [newCommentText, setNewCommentText] = useState("");
  const [reactions, setReactions] = useState({}); // { [id]: 'like' | 'dislike' }
  const [copiedId, setCopiedId] = useState(null);
  const [showToast, setShowToast] = useState("");
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  // Comments thread expansion state - default true (comments visible by default)
  const [showComments, setShowComments] = useState(true);

  // Post text truncation expansion state
  const [isPostExpanded, setIsPostExpanded] = useState(false);

  // Add Comment input toggle state
  const [isAddingComment, setIsAddingComment] = useState(false);

  // Pagination state for comments: Initially 1 comment visible by default, loads 2 more on each "Read more" click
  const [visibleCount, setVisibleCount] = useState(1);

  // Active reply state: { parentCommentId: string | null }
  const [activeReplyId, setActiveReplyId] = useState(null);
  const [replyInputText, setReplyInputText] = useState("");
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);
  const [replyError, setReplyError] = useState("");
  const replyRequest = useRef(null);

  const [commentsStatus, setCommentsStatus] = useState("idle");
  const [commentsReloadKey, setCommentsReloadKey] = useState(0);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [commentError, setCommentError] = useState("");
  const commentRequest = useRef(null);

  useEffect(() => {
    const controller = new AbortController();
    setArticleStatus("loading");
    setArticle(null);
    setComments([]);
    setReactions({});
    setImageFailed(false);
    setIsPostExpanded(false);
    setVisibleCount(1);
    setActiveReplyId(null);
    setReplyInputText("");
    async function loadArticle() {
      try {
        const latest = await fetchNewestDjangoArticle({ signal: controller.signal });
        if (controller.signal.aborted) return;
        setArticle(latest);

        if (latest) {
          try {
            setReactions(JSON.parse(localStorage.getItem("phidim_article_reactions_" + latest.id) || "{}"));
          } catch {}
        }
        setArticleStatus(latest ? "ready" : "empty");
      } catch (error) {
        if (!controller.signal.aborted) setArticleStatus("error");
      }
    }
    loadArticle();
    return () => controller.abort();
  }, [reloadKey]);

  useEffect(() => {
    try {
      const draft = sessionStorage.getItem("phidim_pending_comment_draft");
      if (draft) {
        setNewCommentText(draft);
        setShowComments(true);
        setIsAddingComment(true);
        sessionStorage.removeItem("phidim_pending_comment_draft");
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (!article?.id) return;
    const controller = new AbortController();
    setCommentsStatus("loading");
    fetchDjangoComments(article.id, { signal: controller.signal }).then((saved) => {
      if (controller.signal.aborted) return;
      setComments(saved);
      setCommentsStatus("ready");
    }).catch(() => {
      if (!controller.signal.aborted) setCommentsStatus("error");
    });
    return () => controller.abort();
  }, [article?.id, commentsReloadKey]);

  useEffect(() => {
    setCommentError("");
    setIsSubmittingComment(false);
    setReplyError("");
    setIsSubmittingReply(false);
    return () => {
      commentRequest.current?.abort();
      commentRequest.current = null;
      replyRequest.current?.abort();
      replyRequest.current = null;
    };
  }, [article?.id]);

  const saveComments = (updated) => setComments(updated);

  // Helper to extract text for current selected language (Nepali or English)
  const getCommentText = (item, lang) => {
    if (item.translations) {
      if (item.translations[lang]) return item.translations[lang];
      if (item.translations["Nepali"]) return item.translations["Nepali"];
      if (item.translations["English"]) return item.translations["English"];
    }
    return item.text || "";
  };

  const handleInputFocus = () => {
    // Open for all community visitors
  };

  const triggerToast = (msg) => {
    setShowToast(msg);
    setTimeout(() => {
      setShowToast("");
    }, 4000);
  };

  const handleAddComment = async (e) => {
    e?.preventDefault();
    if (!article || commentRequest.current || commentsStatus === "loading") return;
    const trimmed = newCommentText.trim();
    if (!trimmed) return;
    setCommentError("");
    if (!isAuthenticated) {
      setShowLoginPrompt(true);
      try { sessionStorage.setItem("phidim_pending_comment_draft", trimmed); } catch {}
      return;
    }
    if (!/^[1-9]\d*$/.test(String(user?.id ?? ""))) {
      setCommentError("Please sign in with a valid user account to comment.");
      return;
    }
    const controller = new AbortController();
    commentRequest.current = controller;
    setIsSubmittingComment(true);
    try {
      const saved = await postDjangoComment({ text: trimmed, articleId: article.id, userId: user.id, signal: controller.signal });
      if (controller.signal.aborted) return;
      // A scalar user ID in the response has no display fields; use this session's profile.
      const author = {
        ...saved.author,
        name: saved.author.name === "Community Member" ? user.displayName || user.name || saved.author.name : saved.author.name,
        avatarUrl: saved.author.avatarUrl === "/logo.png" ? user.avatar || saved.author.avatarUrl : saved.author.avatarUrl,
      };
      setComments(prev => [{ ...saved, author }, ...prev.filter(c => c.id !== saved.id)]);
      setNewCommentText("");
      setIsAddingComment(false);
      setShowLoginPrompt(false);
      setShowComments(true);
      try { sessionStorage.removeItem("phidim_pending_comment_draft"); } catch {}
      triggerToast("Your comment has been posted to the discussion!");
    } catch (error) {
      if (!controller.signal.aborted) setCommentError(error.message || "Unable to post your comment. Please try again.");
    } finally {
      if (commentRequest.current === controller) {
        commentRequest.current = null;
        setIsSubmittingComment(false);
      }
    }
  };

  const handleAddReply = async (parentCommentId) => {
    if (!article || replyRequest.current || commentsStatus === "loading") return;
    const trimmed = replyInputText.trim();
    if (!trimmed) return;
    setReplyError("");
    if (!isAuthenticated) {
      setReplyError("Please sign in to post a reply.");
      return;
    }
    const parent = comments.find((c) => c.id === parentCommentId);
    if (!parent?.djangoId) {
      setReplyError("Please reload comments before replying.");
      return;
    }
    const controller = new AbortController();
    replyRequest.current = controller;
    setIsSubmittingReply(true);
    try {
      const savedReply = await postDjangoReply({
        commentDjangoId: parent.djangoId,
        replyText: trimmed,
        articleId: article.id,
        signal: controller.signal,
      });
      if (controller.signal.aborted) return;
      setComments(prev => prev.map(c => c.id === parentCommentId
        ? { ...c, replies: [...(c.replies || []).filter(r => r.id !== savedReply.id), savedReply] }
        : c));
      setReplyInputText("");
      setActiveReplyId(null);
      triggerToast("Your reply has been posted!");
    } catch (error) {
      if (!controller.signal.aborted) setReplyError(error.message || "Unable to post your reply. Please try again.");
    } finally {
      if (replyRequest.current === controller) {
        replyRequest.current = null;
        setIsSubmittingReply(false);
      }
    }
  };

  const handleReaction = async (id, type) => {
    if (!isAuthenticated) {
      handleUnauthenticatedLike(router);
      return;
    }
    if (!BACKEND_READY) {
      triggerBackendWarning();
      return;
    }
    const currentReaction = reactions[id];
    let nextReaction = null;
    let likeDelta = 0;
    let dislikeDelta = 0;

    if (currentReaction === type) {
      nextReaction = null;
      if (type === "like") likeDelta = -1;
      if (type === "dislike") dislikeDelta = -1;
    } else {
      nextReaction = type;
      if (type === "like") {
        likeDelta = 1;
        if (currentReaction === "dislike") dislikeDelta = -1;
      } else if (type === "dislike") {
        dislikeDelta = 1;
        if (currentReaction === "like") likeDelta = -1;
      }
    }

    const updatedReactions = { ...reactions, [id]: nextReaction };
    setReactions(updatedReactions);
    try {
      localStorage.setItem("phidim_article_reactions_" + article.id, JSON.stringify(updatedReactions));
    } catch (err) { }

    const targetComment = comments.find((c) => c.id === id);
    const updatedComments = comments.map((c) => {
      if (c.id === id) {
        return {
          ...c,
          likes: Math.max(0, (c.likes || 0) + likeDelta),
          dislikes: Math.max(0, (c.dislikes || 0) + dislikeDelta),
        };
      }
      if (c.replies && c.replies.length > 0) {
        const updatedReplies = c.replies.map((r) => {
          if (r.id === id) {
            return {
              ...r,
              likes: Math.max(0, (r.likes || 0) + likeDelta),
            };
          }
          return r;
        });
        return { ...c, replies: updatedReplies };
      }
      return c;
    });

    saveComments(updatedComments);

    // Sync like with Django backend
    if (type === "like" && targetComment) {
      const commentDjangoId =
        targetComment.djangoId ||
        (typeof id === "string" && id.startsWith("django-cmt-")
          ? parseInt(id.replace("django-cmt-", ""), 10)
          : null);
      if (commentDjangoId) {
        likeDjangoComment(commentDjangoId, nextReaction === "like" ? "like" : "unlike");
      }
    }
  };

  const handleShare = (item) => {
    const activeText = item.content || getCommentText(item, activeLang);
    const shareText = `"${activeText}" — ${item.title || item.author?.name || "Article"} on Phidim Service (https://phidimservice.com.np)`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareText);
      setCopiedId(item.id);
      setTimeout(() => setCopiedId(null), 2000);
      triggerToast("Post copied to clipboard!");
    }
  };

  const handleReadMore = () => {
    setVisibleCount((prev) => prev + 2);
  };

  const handleShowLess = () => {
    setVisibleCount(1);
  };


  const postComments = comments;
  const visiblePostComments = postComments.slice(0, visibleCount);
  const hasMoreComments = postComments.length > visibleCount;

  // Calculate total comments + nested replies count
  const totalCommentsAndRepliesCount = postComments.reduce(
    (acc, c) => acc + 1 + (c.replies?.length || 0),
    0
  );

  if (articleStatus !== "ready" || !article) {
    return (
      <div className="w-full py-6 border-y border-gray-300 dark:border-slate-700 text-sm text-gray-600 dark:text-gray-300" role={articleStatus === "error" ? "alert" : "status"}>
        {articleStatus === "loading" ? "Loading article…" : articleStatus === "empty" ? "No articles available yet." : "Unable to load the article."}
        {articleStatus === "error" && (
          <button type="button" onClick={() => setReloadKey((key) => key + 1)} className="ml-3 font-bold text-emerald-600 hover:underline cursor-pointer">Retry</button>
        )}
      </div>
    );
  }

  return (
    <div className="w-full font-site">
      {/* Toast Notification */}
      {showToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-xs font-bold px-4 py-3 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{showToast}</span>
        </div>
      )}

      {/* OPEN FULL PAGE SECTION (NO BOXES, SEPARATED BY LINES ONLY) */}
      <div className="w-full space-y-3">

        <article className="py-3 space-y-3 border-y border-gray-300 dark:border-slate-700">
          <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 dark:text-white">{article?.title}</h2>
          {article?.created_at && !Number.isNaN(Date.parse(article.created_at)) && (
            <time dateTime={article.created_at} className="block text-xs text-gray-500">
              {new Date(article.created_at).toLocaleDateString()}
            </time>
          )}
          {article?.image && !imageFailed && (
            <img src={article.image} alt={article.title} onError={() => setImageFailed(true)}
              className="w-full max-h-96 object-contain rounded-xl" />
          )}
          <p className="text-sm leading-relaxed whitespace-pre-wrap break-words text-gray-800 dark:text-gray-100">
            {isPostExpanded || article.content.length <= 160 ? article.content : article.content.slice(0, 160) + "…"}
          </p>
          {article.content.length > 160 && (
            <button type="button" aria-expanded={isPostExpanded} onClick={() => setIsPostExpanded(!isPostExpanded)}
              className="text-sm font-bold text-blue-600 hover:underline cursor-pointer">
              {isPostExpanded ? "Show less" : "Read more"}
            </button>
          )}
          <button type="button" onClick={() => handleShare(article)}
            className="flex items-center gap-1 text-xs font-semibold text-emerald-600 cursor-pointer" title="Share article">
            <Share2 className="w-4 h-4" /> Share
          </button>
        </article>

        {/* LINE SEPARATOR ONLY */}
        <div className="border-t border-gray-200 dark:border-slate-800 my-2" />

        {/* 3. COMMUNITY COMMENTS SECTION (NO BOXES, LINE SEPARATED) */}
        <div className="space-y-3">
          {/* Toggle / Header Bar */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowComments(!showComments)}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-800 dark:text-gray-200 font-bold text-xs transition-all cursor-pointer border border-gray-200 dark:border-slate-700/80"
              >
                <MessageSquare className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>
                  {showComments
                    ? "Hide comments"
                    : `View comments (${totalCommentsAndRepliesCount})`}
                </span>
                {showComments ? (
                  <ChevronUp className="w-3.5 h-3.5 text-gray-500" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5 text-gray-500 animate-bounce" />
                )}
              </button>

              {/* Add Comment Button */}
              <button
                onClick={() => {
                  setIsAddingComment(!isAddingComment);
                  if (!showComments) setShowComments(true);
                  setTimeout(() => {
                    inputRef.current?.focus();
                  }, 100);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-all cursor-pointer shadow-2xs hover:scale-105"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Comment</span>
              </button>
            </div>

            <span className="text-[11px] text-gray-400 font-medium hidden sm:inline-block">
              {showComments
                ? `Showing ${visiblePostComments.length} of ${postComments.length} comments`
                : "Click to view community responses"}
            </span>
          </div>

          {/* Inline Add Comment Input */}
          {isAddingComment && (
            <div className="pt-1 animate-in fade-in duration-200">
              <form
                onSubmit={handleAddComment}
                className="flex items-center gap-2 bg-gray-50 dark:bg-slate-800/80 border border-gray-200 dark:border-slate-700 rounded-full px-3.5 py-1.5 shadow-2xs focus-within:ring-2 focus-within:ring-emerald-500/20"
              >
                <input
                  ref={inputRef}
                  type="text"
                  aria-label="Comment text"
                  disabled={isSubmittingComment}
                  value={newCommentText}
                  onChange={(e) => setNewCommentText(e.target.value)}
                  placeholder="Show your feelings through adding a comment..."
                  className="flex-1 bg-transparent text-xs text-gray-800 dark:text-gray-100 placeholder-gray-500 focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={!newCommentText.trim() || isSubmittingComment || commentsStatus === "loading"}
                  className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white rounded-full text-xs font-bold cursor-pointer transition-colors"
                >
                  {isSubmittingComment ? "Posting…" : "Post"}
                </button>
                <button
                  type="button"
                  disabled={isSubmittingComment}
                  onClick={() => setIsAddingComment(false)}
                  className="px-2 py-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
              </form>
              {commentError && <p role="alert" className="mt-2 text-xs text-red-600">{commentError}</p>}
              {showLoginPrompt && !isAuthenticated && (
                <p role="alert" className="mt-2 text-xs text-gray-600 dark:text-gray-300">
                  Please sign in to post a comment. Your draft will be saved.{" "}
                  <button type="button" className="font-bold text-emerald-600 hover:underline cursor-pointer" onClick={() => {
                    try { sessionStorage.setItem("phidim_pending_comment_draft", newCommentText); } catch {}
                    router.push("/login?redirect=/");
                  }}>Sign in</button>
                </p>
              )}
            </div>
          )}

          {/* Expandable Comments List (No Box Around Comments, Separated by Lines) */}
          {showComments && (
            <div className="space-y-3 pt-1 divide-y divide-gray-200 dark:divide-slate-800 animate-in fade-in duration-300">
              {commentsStatus === "loading" && <p role="status" className="text-xs text-gray-500">Loading comments…</p>}
              {commentsStatus === "error" && (
                <p role="alert" className="text-xs text-red-600">
                  Unable to load comments.{" "}
                  <button type="button" disabled={isSubmittingComment} onClick={() => setCommentsReloadKey(key => key + 1)} className="font-bold hover:underline cursor-pointer">Retry comments</button>
                </p>
              )}
              {commentsStatus === "ready" && comments.length === 0 && <p className="text-xs text-gray-500">No comments yet. Be the first to comment.</p>}
              {visiblePostComments.map((cmt) => {
                const textInLang = getCommentText(cmt, activeLang);
                const isReplying = activeReplyId === cmt.id;

                return (
                  <div key={cmt.id} className="pt-2.5 first:pt-0 space-y-1.5">
                    {/* Author Header */}
                    <div className="flex items-center gap-2">
                      <div className="relative w-7 h-7 rounded-full overflow-hidden ring-1 ring-gray-200 dark:ring-slate-700 bg-slate-900 shrink-0">
                        <img
                          src={cmt.author.avatarUrl}
                          alt={cmt.author.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <h4 className="font-bold text-xs text-gray-900 dark:text-white tracking-tight">
                          {cmt.author.name}
                        </h4>
                        {cmt.author.role && (
                          <span className="text-[10px] text-gray-500 dark:text-gray-400">
                            {cmt.author.role} • {cmt.createdAt}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Comment Content (No Box) */}
                    <div className="pl-0 sm:pl-9 space-y-1.5">
                      <p
                        key={activeLang}
                        className="text-xs sm:text-[13px] text-gray-800 dark:text-gray-200 leading-relaxed font-normal animate-in fade-in duration-200"
                      >
                        {textInLang}
                      </p>

                      {/* Comment Actions: Reply, Like, Dislike, Share */}
                      <div className="flex items-center justify-end gap-3.5 text-gray-700 dark:text-gray-300 pt-0.5">
                        <button
                          disabled={isSubmittingReply}
                          onClick={() => {
                            setActiveReplyId(isReplying ? null : cmt.id);
                            setReplyInputText("");
                            setReplyError("");
                          }}
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 transition-colors cursor-pointer"
                          title="Reply to comment"
                        >
                          <MessageSquare className="w-3 h-3" />
                          <span>Reply</span>
                        </button>

                        <button
                          onClick={() => handleReaction(cmt.id, "like")}
                          className={`inline-flex items-center gap-1 text-xs font-semibold transition-colors cursor-pointer hover:text-blue-600 ${
                            reactions[cmt.id] === "like" ? "text-blue-600 font-bold" : ""
                          }`}
                          title="Like"
                        >
                          <ThumbsUp
                            className={`w-3.5 h-3.5 ${
                              reactions[cmt.id] === "like" ? "fill-blue-600 text-blue-600" : ""
                            }`}
                          />
                          {cmt.likes > 0 && <span className="text-xs">{cmt.likes}</span>}
                        </button>

                        <button
                          onClick={() => handleReaction(cmt.id, "dislike")}
                          className={`inline-flex items-center gap-1 text-xs font-semibold transition-colors cursor-pointer hover:text-red-600 ${
                            reactions[cmt.id] === "dislike" ? "text-red-600 font-bold" : ""
                          }`}
                          title="Dislike"
                        >
                          <ThumbsDown
                            className={`w-3.5 h-3.5 ${
                              reactions[cmt.id] === "dislike" ? "fill-red-600 text-red-600" : ""
                            }`}
                          />
                        </button>

                        <button
                          onClick={() => handleShare(cmt)}
                          className="inline-flex items-center gap-1 text-xs font-semibold transition-colors cursor-pointer hover:text-emerald-600"
                          title="Share comment"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Inline Reply Input Box */}
                      {isReplying && (
                        <div className="mt-2 pt-2 border-t border-gray-100 dark:border-slate-800 flex items-center gap-2 animate-in fade-in duration-200">
                          <CornerDownRight className="w-4 h-4 text-gray-400 shrink-0" />
                          <input
                            type="text"
                            aria-label="Reply text"
                            disabled={isSubmittingReply}
                            value={replyInputText}
                            onChange={(e) => setReplyInputText(e.target.value)}
                            placeholder={`Reply to ${cmt.author.name}...`}
                            className="flex-1 bg-gray-50 dark:bg-slate-800/80 border border-gray-200 dark:border-slate-700 rounded-full px-4 py-2 text-xs text-gray-800 dark:text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                handleAddReply(cmt.id);
                              }
                            }}
                          />
                          <button
                            onClick={() => handleAddReply(cmt.id)}
                            disabled={isSubmittingReply || commentsStatus === "loading" || !replyInputText.trim()}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white rounded-full text-xs font-bold cursor-pointer transition-colors"
                          >
                            {isSubmittingReply ? "Sending…" : "Send"}
                          </button>
                          <button
                            disabled={isSubmittingReply}
                            onClick={() => {
                              setActiveReplyId(null);
                              setReplyInputText("");
                              setReplyError("");
                            }}
                            className="px-3 py-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 text-xs font-semibold cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      )}
                      {isReplying && replyError && (
                        <p role="alert" className="mt-2 text-xs text-red-600">
                          {replyError}{" "}
                          {!isAuthenticated && <button type="button" className="font-bold text-emerald-600 hover:underline cursor-pointer" onClick={() => router.push("/login?redirect=/")}>Sign in</button>}
                        </p>
                      )}

                      {/* Nested Replies Thread */}
                      {cmt.replies && cmt.replies.length > 0 && (
                        <div className="mt-2 space-y-1.5 pl-4 sm:pl-6 border-l-2 border-emerald-500/20 dark:border-emerald-500/10">
                          {cmt.replies.map((reply) => {
                            const replyText = getCommentText(reply, activeLang);
                            return (
                              <div
                                key={reply.id}
                                className="space-y-1 animate-in fade-in duration-200 pt-1"
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-2">
                                    <div className="w-5 h-5 rounded-full overflow-hidden ring-1 ring-emerald-400/40 shrink-0">
                                      <img
                                        src={reply.author.avatarUrl}
                                        alt={reply.author.name}
                                        className="w-full h-full object-cover"
                                      />
                                    </div>
                                    <div>
                                      <span className="font-bold text-xs text-gray-900 dark:text-white">
                                        {reply.author.name}
                                      </span>
                                      {reply.author.role && (
                                        <span className="ml-2 text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded-full">
                                          {reply.author.role}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  <span className="text-[10px] text-gray-400">{reply.createdAt}</span>
                                </div>

                                <p className="text-xs text-gray-800 dark:text-gray-200 pl-7 font-normal leading-relaxed">
                                  {replyText}
                                </p>

                                <div className="flex items-center justify-end gap-3 pt-0.5">
                                  <button
                                    onClick={() => handleReaction(reply.id, "like")}
                                    className={`inline-flex items-center gap-1 text-xs transition-colors cursor-pointer hover:text-blue-600 ${
                                      reactions[reply.id] === "like"
                                        ? "text-blue-600 font-bold"
                                        : "text-gray-500"
                                    }`}
                                  >
                                    <ThumbsUp
                                      className={`w-3.5 h-3.5 ${
                                        reactions[reply.id] === "like"
                                          ? "fill-blue-600 text-blue-600"
                                          : ""
                                      }`}
                                    />
                                    {reply.likes > 0 && (
                                      <span className="text-[11px]">{reply.likes}</span>
                                    )}
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Read More Pagination Bar */}
              <div className="pt-2.5 flex flex-col sm:flex-row items-center justify-center gap-3">
                {hasMoreComments ? (
                  <button
                    onClick={handleReadMore}
                    className="inline-flex items-center gap-2 px-5 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-900 dark:text-white font-bold text-xs uppercase tracking-wider transition-all hover:scale-105 cursor-pointer border border-gray-200 dark:border-slate-700"
                    title="Show more comments"
                  >
                    <span>Read more ({postComments.length - visibleCount} more)</span>
                    <ChevronDown className="w-4 h-4 text-emerald-600 dark:text-emerald-400 animate-bounce" />
                  </button>
                ) : postComments.length > 1 && visibleCount > 1 ? (
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                      Showing all {postComments.length} comments{" "}
                      <FaWandMagicSparkles aria-hidden="true" className="inline-block w-3 h-3 align-middle" />
                    </span>
                    <button
                      onClick={handleShowLess}
                      className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300 font-bold text-[11px] transition-colors cursor-pointer hover:scale-105"
                      title="Collapse to default view"
                    >
                      <span>Show less</span>
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
