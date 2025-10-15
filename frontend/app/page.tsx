"use client";

import { useState } from "react";
import { useForm } from "@conform-to/react";
import { parseWithZod } from "@conform-to/zod/v4";
import z from "zod";

export const schema = z.object({
  content: z
  .coerce
  .string()
  .min(100, "100文字以上で入力してください。")
  .max(5000, "5000文字以内で入力してください")
});

export default function Home() {
  const [streamingText, setStreamingText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, fields] = useForm({
    onValidate({ formData }) {
      return parseWithZod(formData, { schema });
    },
    shouldValidate: "onBlur",
    shouldRevalidate: "onInput",
    onSubmit: async (event, { formData }) => {
      event.preventDefault();

      const submission = parseWithZod(formData, { schema });
      if (submission.status !== "success") {
        return;
      }

      setError("");
      setStreamingText("");
      setIsLoading(true);

      try {
        const response = await fetch("/api/review", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ content: submission.value.content }),
        });

        if (!response.ok) {
          throw new Error("レビューの生成に失敗しました");
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        if (reader) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) {
              console.log("Stream done");
              break;
            }

            const text = decoder.decode(value, { stream: true });
            console.log("Received text chunk:", text);
            setStreamingText((prev) => prev + text);
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "エラーが発生しました");
      } finally {
        setIsLoading(false);
      }
    },
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Header Section */}
        <div className="text-center mb-8 animate-fade-in">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-600 via-blue-600 to-pink-600 bg-clip-text text-transparent mb-4">
            AI ブログレビュー
          </h1>
          <p className="text-gray-600 text-lg">
            AIがあなたのブログを分析し、プロフェッショナルなレビューを提供します
          </p>
        </div>

        {/* Streaming Result Section */}
        {(streamingText || isLoading) && (
          <div className="mt-8 mb-8 bg-white rounded-2xl shadow-2xl p-8 backdrop-blur-sm bg-opacity-90 animate-fade-in">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 bg-gradient-to-r from-purple-600 via-blue-600 to-pink-600 rounded-lg">
                <svg
                  className="h-6 w-6 text-white"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-800">AIレビュー結果</h2>
              {isLoading && (
                <div className="ml-auto flex items-center space-x-2 text-sm text-gray-500">
                  <div className="animate-pulse">生成中</div>
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                    <div className="w-2 h-2 bg-pink-600 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                  </div>
                </div>
              )}
            </div>

            <div className="prose prose-lg max-w-none">
              <div className="znc text-gray-700 leading-relaxed whitespace-pre-wrap">
                {streamingText}
                {isLoading && (
                  <span className="inline-block w-1 h-5 bg-purple-600 ml-1 animate-pulse"></span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Form Card */}
        <form
          id={form.id}
          onSubmit={form.onSubmit}
          className="bg-white rounded-2xl shadow-2xl p-8 backdrop-blur-sm bg-opacity-90 transform transition-all hover:scale-[1.01] duration-300"
        >
          {/* Form Errors */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-r-lg">
              <p className="text-red-700 text-sm font-medium">{error}</p>
            </div>
          )}

          {/* Textarea Field */}
          <div className="space-y-3">
            <label
              htmlFor={fields.content.id}
              className="block text-sm font-semibold text-gray-700 mb-2"
            >
              ブログコンテンツ
            </label>

            <textarea
              id={fields.content.id}
              name={fields.content.name}
              key={fields.content.key}
              rows={8}
              placeholder="レビューしたいブログ記事の本文を入力してください..."
              className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-purple-100 focus:border-purple-500 outline-none transition-all duration-200 text-gray-700 placeholder-gray-400 resize-none"
              disabled={isLoading}
            />

            {/* Field Errors */}
            {fields.content.errors && (
              <div className="flex items-start space-x-2 text-red-600 text-sm mt-2">
                <svg
                  className="h-5 w-5 flex-shrink-0 mt-0.5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>{fields.content.errors}</span>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-8 bg-gradient-to-r from-purple-600 via-blue-600 to-pink-600 text-white font-semibold py-4 px-6 rounded-xl hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-purple-300 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            <span className="flex items-center justify-center space-x-2">
              {isLoading ? (
                <>
                  <svg
                    className="animate-spin h-5 w-5"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  <span>分析中...</span>
                </>
              ) : (
                <>
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  <span>AIでレビューを生成</span>
                </>
              )}
            </span>
          </button>
        </form>
      </div>
    </div>
  );
}
