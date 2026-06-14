import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Bell, User, Menu } from 'lucide-react';

const Header = ({ toggleSidebar }) => {
    const { user } = useAuth();

    return (
        <header className="sticky top-0 z-40 w-full h-16 bg-white/80 backdrop-blur-xl border-b border-slate-200/60">
            <div className="flex items-center justify-between h-full px-6">
                {/* Mobile Menu Button */}
                <button
                    onClick={toggleSidebar}
                    className="md:hidden inline-flex items-center justify-center w-10 h-10 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all duration-200"
                    aria-label="Toggle sidebar"
                >
                    <Menu size={24} />
                </button>

                <div className=""></div>

                <div className="">
                    <button className="">
                        <Bell
                            size={20}
                            strokeWidth={2}
                            className=""
                        />

                        <span className=""></span>
                    </button>
                    <div className=''>
                        <div className=''>
                            <div className=''>
                                <User size={10} strokeWidth={2.5}/>
                            </div>
                        </div>
                        <p className="">
                            {user?.username || 'User'}
                        </p>

                        <p className="">
                            {user?.email || 'user@example.com'}
                        </p>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;