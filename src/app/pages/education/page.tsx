// pages/education/page.tsx
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  PlayCircle, 
  CheckCircle, 
  Lock, 
  Clock, 
  Trophy,
  Star,
  Users,
  ArrowRight,
  BookOpen,
  Target,
  BarChart3,
  TrendingUp
} from 'lucide-react';
import { courses } from '@/lib/courses';

// Types
interface Lesson {
  id: string;
  title: string;
  duration: string;
  isCompleted: boolean;
  isLocked: boolean;
}

interface Course {
  id: string;
  title: string;
  category: string;
  progress: number;
  totalLessons: number;
  completedLessons: number;
  duration: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  rating: number;
  students: number;
  lessons: Lesson[];
  slug: string;
  description: string;
  thumbnail?: string;
}

// Convert existing courses data to new format
const convertCoursesToNewFormat = (): Course[] => {
  return courses.map((course) => ({
    id: course.id,
    title: course.title,
    category: 'Trading',
    progress: Math.floor(Math.random() * 100), // Random progress for demo
    totalLessons: course.videos ? course.videos.length : Math.floor(Math.random() * 15) + 5,
    completedLessons: Math.floor(Math.random() * 8) + 1,
    duration: `${Math.floor(Math.random() * 4) + 2}.${Math.floor(Math.random() * 9)} hours`,
    difficulty: ['Beginner', 'Intermediate', 'Advanced'][Math.floor(Math.random() * 3)] as 'Beginner' | 'Intermediate' | 'Advanced',
    rating: 4.5 + Math.random() * 0.5,
    students: Math.floor(Math.random() * 2000) + 500,
    slug: course.slug,
    description: course.description,
    thumbnail: course.thumbnail,
    lessons: course.videos ? course.videos.map((video, vidIndex) => ({
      id: `${course.id}-${vidIndex}`,
      title: video.title,
      duration: video.duration || `${Math.floor(Math.random() * 20) + 5} min`,
      isCompleted: Math.random() > 0.6,
      isLocked: vidIndex > Math.floor(Math.random() * 3) + 1
    })) : []
  }));
};

const coursesData = convertCoursesToNewFormat();

const achievements = [
  { icon: Trophy, title: 'First Course', subtitle: 'Complete your first trading course', earned: true },
  { icon: Target, title: 'Trading Streak', subtitle: '7 days learning streak', earned: true },
  { icon: TrendingUp, title: 'Chart Master', subtitle: 'Complete all chart analysis lessons', earned: false },
  { icon: Star, title: 'Top Trader', subtitle: 'Score 90%+ on 3 trading quizzes', earned: false },
];

export default function EducationPage(): JSX.Element {
  const router = useRouter();
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [activeTab, setActiveTab] = useState<'courses' | 'progress' | 'achievements'>('courses');

  const getDifficultyColor = (difficulty: string): string => {
    switch (difficulty) {
      case 'Beginner': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'Intermediate': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'Advanced': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-white/20 text-white border-white/30';
    }
  };

  const ProgressBar = ({ progress, className = "" }: { progress: number; className?: string }) => (
    <div className={`w-full bg-white/10 rounded-full h-2 ${className}`}>
      <div 
        className="bg-white h-2 rounded-full transition-all duration-500 ease-out"
        style={{ width: `${Math.min(progress, 100)}%` }}
      />
    </div>
  );

  if (selectedCourse) {
    return (
      <div className="min-h-screen bg-black text-white">
        {/* Header */}
        <div className="sticky top-0 z-20 bg-black/90 backdrop-blur border-b border-white/10">
          <div className="px-4 py-4" style={{ paddingTop: 'calc(1rem + env(safe-area-inset-top))' }}>
            <button 
              onClick={() => setSelectedCourse(null)}
              className="text-white/70 hover:text-white mb-3 text-sm flex items-center gap-1"
            >
              <ArrowRight className="w-4 h-4 rotate-180" />
              Back to Education
            </button>
            <h1 className="text-xl font-bold mb-2">{selectedCourse.title}</h1>
            <div className="flex items-center gap-4 text-sm text-white/60">
              <span>{selectedCourse.completedLessons}/{selectedCourse.totalLessons} lessons</span>
              <span>{selectedCourse.duration}</span>
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 fill-white text-white" />
                <span>{selectedCourse.rating.toFixed(1)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Course Progress */}
        <div className="px-4 py-6">
          <div className="bg-white/5 rounded-2xl p-6 border border-white/10 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold">Course Progress</h2>
              <span className="text-2xl font-bold">{selectedCourse.progress}%</span>
            </div>
            <ProgressBar progress={selectedCourse.progress} className="mb-2" />
            <p className="text-sm text-white/60">
              {selectedCourse.completedLessons} of {selectedCourse.totalLessons} lessons completed
            </p>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <button
              onClick={() => router.push(`/education/${selectedCourse.slug}`)}
              className="bg-white text-black rounded-xl py-3 px-4 font-semibold flex items-center justify-center gap-2 hover:bg-white/90 transition-colors"
            >
              <PlayCircle className="w-5 h-5" />
              Continue Learning
            </button>
            <button
              onClick={() => router.push('/education/chart')}
              className="bg-white/10 border border-white/20 text-white rounded-xl py-3 px-4 font-semibold flex items-center justify-center gap-2 hover:bg-white/20 transition-colors"
            >
              <BarChart3 className="w-5 h-5" />
              Open Chart
            </button>
          </div>

          {/* Lessons List */}
          <div className="space-y-3">
            <h3 className="font-semibold mb-4">Course Content</h3>
            {selectedCourse.lessons.length > 0 ? (
              selectedCourse.lessons.map((lesson) => (
                <div 
                  key={lesson.id} 
                  className={`rounded-xl p-4 border transition-all cursor-pointer ${
                    lesson.isLocked 
                      ? 'bg-white/5 border-white/10 opacity-50' 
                      : 'bg-white/5 border-white/10 hover:bg-white/10'
                  }`}
                  onClick={() => !lesson.isLocked && router.push(`/education/${selectedCourse.slug}`)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                      {lesson.isLocked ? (
                        <Lock className="w-5 h-5 text-white/40" />
                      ) : lesson.isCompleted ? (
                        <CheckCircle className="w-5 h-5 text-green-400" />
                      ) : (
                        <PlayCircle className="w-5 h-5 text-white" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h4 className={`font-medium ${lesson.isLocked ? 'text-white/40' : 'text-white'}`}>
                        {lesson.title}
                      </h4>
                      <div className="flex items-center gap-2 mt-1">
                        <Clock className="w-4 h-4 text-white/40" />
                        <span className="text-sm text-white/60">{lesson.duration}</span>
                      </div>
                    </div>
                    {!lesson.isLocked && (
                      <ArrowRight className="w-5 h-5 text-white/60" />
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-white/5 rounded-xl p-8 border border-white/10 text-center">
                <BookOpen className="w-12 h-12 text-white/40 mx-auto mb-4" />
                <h3 className="font-semibold mb-2">Course Content Coming Soon</h3>
                <p className="text-sm text-white/60 mb-4">
                  Detailed lessons are being prepared for this course.
                </p>
                <button
                  onClick={() => router.push(`/education/${selectedCourse.slug}`)}
                  className="bg-white text-black rounded-lg py-2 px-4 font-medium hover:bg-white/90 transition-colors"
                >
                  Explore Now
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-black/90 backdrop-blur border-b border-white/10">
        <div className="px-4 py-4" style={{ paddingTop: 'calc(1rem + env(safe-area-inset-top))' }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold">Trading Education</h1>
              <p className="text-white/60 text-sm">Master trading through structured courses and videos</p>
            </div>
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-black" />
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex space-x-1 bg-white/5 rounded-lg p-1">
            {[
              { key: 'courses', label: 'Courses', icon: BookOpen },
              { key: 'progress', label: 'Progress', icon: Target },
              { key: 'achievements', label: 'Awards', icon: Trophy }
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key as typeof activeTab)}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-all ${
                  activeTab === key
                    ? 'bg-white text-black'
                    : 'text-white/70 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-6">
        {activeTab === 'courses' && (
          <div className="space-y-6">
            {/* Quick Action */}
            <div className="bg-gradient-to-r from-white/10 to-white/5 rounded-2xl p-6 border border-white/20">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 bg-white/10 rounded-xl flex items-center justify-center">
                  <BarChart3 className="w-8 h-8 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-1">Practice with Live Charts</h3>
                  <p className="text-sm text-white/60">Apply your knowledge on real-time trading charts</p>
                </div>
              </div>
              <button
                onClick={() => router.push('/education/chart')}
                className="w-full bg-white text-black rounded-lg py-3 font-semibold hover:bg-white/90 transition-colors"
              >
                Open Trading Chart
              </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <div className="text-2xl font-bold mb-1">{coursesData.length}</div>
                <div className="text-sm text-white/60">Available Courses</div>
              </div>
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <div className="text-2xl font-bold mb-1">
                  {coursesData.reduce((acc, course) => acc + course.completedLessons, 0)}
                </div>
                <div className="text-sm text-white/60">Lessons Completed</div>
              </div>
            </div>

            {/* Continue Learning */}
            {coursesData.some(course => course.progress > 0 && course.progress < 100) && (
              <div className="mb-6">
                <h2 className="text-lg font-semibold mb-3">Continue Learning</h2>
                {coursesData
                  .filter(course => course.progress > 0 && course.progress < 100)
                  .slice(0, 1)
                  .map(course => (
                    <div 
                      key={course.id}
                      className="bg-gradient-to-r from-white/10 to-white/5 rounded-2xl p-6 border border-white/20 cursor-pointer hover:from-white/15 hover:to-white/10 transition-all"
                      onClick={() => setSelectedCourse(course)}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-white/10 rounded-xl flex items-center justify-center">
                          <PlayCircle className="w-8 h-8 text-white" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold mb-1">{course.title}</h3>
                          <p className="text-sm text-white/60 mb-2">
                            {course.completedLessons}/{course.totalLessons} lessons completed
                          </p>
                          <ProgressBar progress={course.progress} />
                        </div>
                      </div>
                    </div>
                  ))
                }
              </div>
            )}

            {/* All Courses */}
            <div>
              <h2 className="text-lg font-semibold mb-3">All Trading Courses</h2>
              <div className="space-y-4">
                {coursesData.map((course) => (
                  <div 
                    key={course.id}
                    onClick={() => setSelectedCourse(course)}
                    className="bg-white/5 rounded-xl p-4 border border-white/10 cursor-pointer hover:bg-white/10 transition-all"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-semibold mb-1">{course.title}</h3>
                        <p className="text-sm text-white/60 mb-2">{course.description}</p>
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getDifficultyColor(course.difficulty)}`}>
                            {course.difficulty}
                          </span>
                          <span className="text-xs text-white/60">{course.category}</span>
                        </div>
                      </div>
                      <ArrowRight className="w-5 h-5 text-white/40 mt-1" />
                    </div>
                    
                    <div className="flex items-center gap-4 text-xs text-white/60 mb-3">
                      <div className="flex items-center gap-1">
                        <BookOpen className="w-4 h-4" />
                        <span>{course.totalLessons} lessons</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>{course.duration}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        <span>{course.students}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4" />
                        <span>{course.rating.toFixed(1)}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <ProgressBar progress={course.progress} className="flex-1 mr-3" />
                      <span className="text-sm font-medium">{course.progress}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'progress' && (
          <div className="space-y-6">
            {/* Overall Progress */}
            <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
              <h2 className="text-lg font-semibold mb-4">Learning Progress</h2>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Course Completion</span>
                    <span>
                      {Math.round(
                        (coursesData.reduce((acc, course) => acc + course.progress, 0) / coursesData.length) || 0
                      )}%
                    </span>
                  </div>
                  <ProgressBar progress={
                    Math.round(
                      (coursesData.reduce((acc, course) => acc + course.progress, 0) / coursesData.length) || 0
                    )
                  } />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Trading Skills</span>
                    <span>78%</span>
                  </div>
                  <ProgressBar progress={78} />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Chart Analysis</span>
                    <span>65%</span>
                  </div>
                  <ProgressBar progress={65} />
                </div>
              </div>
            </div>

            {/* Learning Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/5 rounded-xl p-4 border border-white/10 text-center">
                <div className="text-2xl font-bold mb-1">
                  {coursesData.reduce((acc, course) => acc + course.completedLessons, 0)}
                </div>
                <div className="text-sm text-white/60">Lessons Done</div>
              </div>
              <div className="bg-white/5 rounded-xl p-4 border border-white/10 text-center">
                <div className="text-2xl font-bold mb-1">
                  {Math.round(
                    coursesData.reduce((acc, course) => acc + parseFloat(course.duration), 0) * 0.6
                  )}h
                </div>
                <div className="text-sm text-white/60">Time Learned</div>
              </div>
              <div className="bg-white/5 rounded-xl p-4 border border-white/10 text-center">
                <div className="text-2xl font-bold mb-1">
                  {coursesData.filter(course => course.progress === 100).length}
                </div>
                <div className="text-sm text-white/60">Completed</div>
              </div>
              <div className="bg-white/5 rounded-xl p-4 border border-white/10 text-center">
                <div className="text-2xl font-bold mb-1">89%</div>
                <div className="text-sm text-white/60">Success Rate</div>
              </div>
            </div>

            {/* Weekly Activity */}
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <h3 className="font-semibold mb-4">This Week&apos;s Trading Study</h3>
              <div className="grid grid-cols-7 gap-2">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, dayIndex) => (
                  <div key={day} className="text-center">
                    <div className="text-xs text-white/60 mb-2">{day}</div>
                    <div 
                      className={`w-8 h-8 rounded mx-auto ${
                        dayIndex < 5 ? 'bg-white' : 'bg-white/20'
                      }`}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'achievements' && (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trophy className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-xl font-bold mb-2">Trading Achievements</h2>
              <p className="text-white/60 text-sm">Unlock badges as you master trading skills</p>
            </div>

            <div className="space-y-4">
              {achievements.map((achievement, achievementIndex) => {
                const Icon = achievement.icon;
                return (
                  <div 
                    key={achievementIndex}
                    className={`rounded-xl p-4 border ${
                      achievement.earned 
                        ? 'bg-white/10 border-white/20' 
                        : 'bg-white/5 border-white/10 opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        achievement.earned ? 'bg-white text-black' : 'bg-white/10 text-white/60'
                      }`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold mb-1">{achievement.title}</h3>
                        <p className="text-sm text-white/60">{achievement.subtitle}</p>
                      </div>
                      {achievement.earned && (
                        <CheckCircle className="w-5 h-5 text-green-400" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Next Achievement */}
            <div className="bg-gradient-to-r from-white/10 to-white/5 rounded-xl p-4 border border-white/20 mt-6">
              <h3 className="font-semibold mb-2">Next Achievement</h3>
              <p className="text-sm text-white/60 mb-3">Complete 2 more trading courses to unlock &ldquo;Master Trader&rdquo; badge</p>
              <ProgressBar progress={60} />
              <p className="text-xs text-white/40 mt-2">3 of 5 courses completed</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
