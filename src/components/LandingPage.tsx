import React from 'react';
import { useTranslation } from '@/i18n/index';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { 
  BookOpen, 
  Calendar, 
  Users, 
  Bell, 
  Clock, 
  GraduationCap,
  School,
  UserCheck,
  Star,
  Check,
  ArrowRight,
  Menu,
  X
} from 'lucide-react';
import { useState } from 'react';

interface LandingPageProps {
  onGetStarted: () => void;
  onSignIn: () => void;
}

export default function LandingPage({ onGetStarted, onSignIn }: LandingPageProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { t } = useTranslation();

  const features = [
    {
      icon: <GraduationCap className="h-8 w-8 text-blue-600" />,
      title: t('landing.features.smart.title'),
      description: t('landing.features.smart.description')
    },
    {
      icon: <Calendar className="h-8 w-8 text-emerald-600" />,
      title: t('landing.features.automatic.title'),
      description: t('landing.features.automatic.description')
    },
    {
      icon: <Clock className="h-8 w-8 text-violet-600" />,
      title: t('landing.features.availability.title'),
      description: t('landing.features.availability.description')
    },
    {
      icon: <Bell className="h-8 w-8 text-orange-600" />,
      title: t('landing.features.notifications.title'),
      description: t('landing.features.notifications.description')
    }
  ];

  const userTypes = [
    {
      icon: <School className="h-12 w-12 text-blue-600" />,
      title: t('landing.userTypes.schools.title'),
      description: t('landing.userTypes.schools.description')
    },
    {
      icon: <Users className="h-12 w-12 text-emerald-600" />,
      title: t('landing.userTypes.teachers.title'),
      description: t('landing.userTypes.teachers.description')
    },
    {
      icon: <UserCheck className="h-12 w-12 text-violet-600" />,
      title: t('landing.userTypes.students.title'),
      description: t('landing.userTypes.students.description')
    }
  ];

  const testimonials = [
    {
      name: "Principal Akmal Nazarov",
      role: "45-School, Tashkent",
      content: "Our school saves hours every week thanks to Timetable.uz! The automatic scheduling is a game-changer.",
      rating: 5
    },
    {
      name: "Teacher Sarah Williams",
      role: "International School",
      content: "Finally, a timetable system that actually works. No more conflicts, no more confusion.",
      rating: 5
    },
    {
      name: "Director Elena Petrov",
      role: "Lyceum #3",
      content: "The best investment we've made for our school administration. Highly recommended!",
      rating: 5
    }
  ];

  const pricingPlans = [
    {
      name: t('landing.pricing.free.name'),
      price: "0",
      period: t('landing.pricing.free.period'),
      description: t('landing.pricing.free.description'),
      features: [
        t('landing.pricing.free.features.1'),
        t('landing.pricing.free.features.2'),
        t('landing.pricing.free.features.3'),
        t('landing.pricing.free.features.4')
      ],
      popular: false
    },
    {
      name: t('landing.pricing.pro.name'),
      price: "29",
      period: t('landing.pricing.pro.period'),
      description: t('landing.pricing.pro.description'),
      features: [
        t('landing.pricing.pro.features.1'),
        t('landing.pricing.pro.features.2'),
        t('landing.pricing.pro.features.3'),
        t('landing.pricing.pro.features.4'),
        t('landing.pricing.pro.features.5'),
        t('landing.pricing.pro.features.6')
      ],
      popular: true
    },
    {
      name: t('landing.pricing.enterprise.name'),
      price: "99",
      period: t('landing.pricing.enterprise.period'),
      description: t('landing.pricing.enterprise.description'),
      features: [
        t('landing.pricing.enterprise.features.1'),
        t('landing.pricing.enterprise.features.2'),
        t('landing.pricing.enterprise.features.3'),
        t('landing.pricing.enterprise.features.4'),
        t('landing.pricing.enterprise.features.5'),
        t('landing.pricing.enterprise.features.6')
      ],
      popular: false
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                <BookOpen className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                Timetable.uz
              </span>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-slate-600 hover:text-blue-600 transition-colors">{t('nav.features')}</a>
              <a href="#for-whom" className="text-slate-600 hover:text-blue-600 transition-colors">{t('nav.forWho')}</a>
              <a href="#testimonials" className="text-slate-600 hover:text-blue-600 transition-colors">{t('nav.testimonials')}</a>
              <a href="#pricing" className="text-slate-600 hover:text-blue-600 transition-colors">{t('nav.pricing')}</a>
              <a href="#contact" className="text-slate-600 hover:text-blue-600 transition-colors">{t('nav.contact')}</a>
            </nav>

            {/* Desktop Auth Buttons */}
            <div className="hidden md:flex items-center gap-4">
              <Button variant="ghost" onClick={onSignIn} className="text-slate-600 hover:text-blue-600">
                {t('app.signIn')}
              </Button>
              <Button onClick={onGetStarted} className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-lg">
                {t('app.getStarted')}
              </Button>
            </div>

            {/* Mobile Menu Button */}
            <button 
              className="md:hidden p-2"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>

          {/* Mobile Menu */}
          {isMobileMenuOpen && (
            <div className="md:hidden py-4 border-t border-slate-200">
              <div className="flex flex-col gap-4">
                <a href="#features" className="text-slate-600 hover:text-blue-600 transition-colors">{t('nav.features')}</a>
                <a href="#for-whom" className="text-slate-600 hover:text-blue-600 transition-colors">{t('nav.forWho')}</a>
                <a href="#testimonials" className="text-slate-600 hover:text-blue-600 transition-colors">{t('nav.testimonials')}</a>
                <a href="#pricing" className="text-slate-600 hover:text-blue-600 transition-colors">{t('nav.pricing')}</a>
                <div className="flex gap-2 pt-2">
                  <Button variant="ghost" onClick={onSignIn} size="sm">{t('app.signIn')}</Button>
                  <Button onClick={onGetStarted} size="sm">{t('app.getStarted')}</Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <Badge className="mb-6 bg-blue-50 text-blue-700 border-blue-200 px-6 py-2">
              {t('landing.hero.badge')}
            </Badge>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-slate-800 via-blue-800 to-slate-800 bg-clip-text text-transparent leading-tight mb-6">
              {t('landing.hero.titlePrefix')} {' '}
              <span className="bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                {t('landing.hero.titleHighlight')}
              </span>
            </h1>

            <p className="text-xl text-slate-600 leading-relaxed mb-10 max-w-3xl mx-auto">
              {t('landing.hero.subtitle')}
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                onClick={onGetStarted}
                size="lg" 
                className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-xl hover:shadow-2xl transition-all text-lg px-8 py-6"
              >
                {t('landing.hero.start')}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button 
                variant="outline" 
                size="lg"
                className="border-slate-300 hover:bg-slate-50 text-lg px-8 py-6"
              >
                {t('landing.hero.demo')}
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white/60 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent mb-4">
              Everything You Need for Perfect Scheduling
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Powerful features designed to make school timetable management effortless and efficient.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="border-none shadow-lg bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300 group">
                <CardHeader className="text-center pb-4">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                    {feature.icon}
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-center text-slate-600 leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Preview Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent mb-4">
              Clear Weekly Overview
            </h2>
            <p className="text-xl text-slate-600">
              Drag & drop to adjust your timetable instantly with our intuitive interface.
            </p>
          </div>
          
          <div className="relative max-w-6xl mx-auto">
            <div className="bg-gradient-to-r from-blue-500/10 via-violet-500/10 to-emerald-500/10 rounded-3xl p-8 backdrop-blur-sm border border-white/20 shadow-2xl">
              <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6">
                  <h3 className="text-xl font-semibold text-white">Grade 10-A Weekly Schedule</h3>
                  <p className="text-blue-100 mt-1">32 students • Mrs. Johnson (Homeroom)</p>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-5 gap-4">
                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map((day) => (
                      <div key={day} className="space-y-3">
                        <div className="bg-slate-100 rounded-lg p-3 text-center font-semibold text-slate-700">
                          {day}
                        </div>
                        <div className="space-y-2">
                          {[1, 2, 3, 4].map((period) => (
                            <div key={period} className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-3 border border-blue-200">
                              <div className="text-xs text-blue-600 font-medium">Period {period}</div>
                              <div className="text-sm font-semibold text-slate-800">Mathematics</div>
                              <div className="text-xs text-slate-600">Mr. Smith</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Who It's For Section */}
      <section id="for-whom" className="py-20 bg-white/60 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent mb-4">
              Built for Everyone in Education
            </h2>
            <p className="text-xl text-slate-600">
              Whether you're an administrator, teacher, or student, Timetable.uz has you covered.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {userTypes.map((type, index) => (
              <Card key={index} className="border-none shadow-lg bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300 group text-center">
                <CardHeader className="pb-6">
                  <div className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                    {type.icon}
                  </div>
                  <CardTitle className="text-2xl">{type.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-slate-600 leading-relaxed text-lg">
                    {type.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent mb-4">
              Loved by Educators Worldwide
            </h2>
            <p className="text-xl text-slate-600">
              See what schools are saying about their experience with Timetable.uz.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="border-none shadow-lg bg-white/80 backdrop-blur-sm">
                <CardContent className="pt-6">
                  <div className="flex mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-slate-700 leading-relaxed mb-6 italic">
                    "{testimonial.content}"
                  </p>
                  <div>
                    <div className="font-semibold text-slate-800">{testimonial.name}</div>
                    <div className="text-slate-600">{testimonial.role}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-white/60 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-slate-600">
              Choose the perfect plan for your school. Start free, upgrade when you need more.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {pricingPlans.map((plan, index) => (
              <Card key={index} className={`border-none shadow-lg bg-white/80 backdrop-blur-sm relative ${plan.popular ? 'ring-2 ring-blue-500 shadow-xl' : ''}`}>
                {plan.popular && (
                  <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                    Most Popular
                  </Badge>
                )}
                <CardHeader className="text-center pb-6">
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">${plan.price}</span>
                    <span className="text-slate-600">/{plan.period}</span>
                  </div>
                  <CardDescription className="mt-2">{plan.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {plan.features.map((feature, featureIndex) => (
                    <div key={featureIndex} className="flex items-center gap-3">
                      <Check className="h-5 w-5 text-emerald-600" />
                      <span className="text-slate-700">{feature}</span>
                    </div>
                  ))}
                  <Button 
                    className={`w-full mt-6 ${plan.popular ? 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700' : ''}`}
                    variant={plan.popular ? 'default' : 'outline'}
                    onClick={onGetStarted}
                  >
                    {plan.name === 'Free' ? 'Start Free' : 'Get Started'}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                  <BookOpen className="h-6 w-6 text-white" />
                </div>
                <span className="text-xl font-bold">Timetable.uz</span>
              </div>
              <p className="text-slate-400 leading-relaxed">
                The intelligent school scheduling platform that saves time and eliminates conflicts.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <div className="space-y-2 text-slate-400">
                <div>Features</div>
                <div>Pricing</div>
                <div>Demo</div>
                <div>Support</div>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <div className="space-y-2 text-slate-400">
                <div>About Us</div>
                <div>Contact</div>
                <div>Privacy Policy</div>
                <div>Terms of Service</div>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Connect</h4>
              <div className="space-y-2 text-slate-400">
                <div>Twitter</div>
                <div>LinkedIn</div>
                <div>Facebook</div>
                <div>Email</div>
              </div>
            </div>
          </div>
          
          <div className="border-t border-slate-800 mt-12 pt-8 text-center text-slate-400">
            <p>&copy; 2025 Timetable.uz. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}