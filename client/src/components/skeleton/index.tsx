const Skeleton = ({ lines = 3 }: { lines?: number }) => {
  return (
    <div className="space-y-2">
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="flex items-center space-x-3 animate-pulse">
          <div className="w-10 h-10 rounded-full bg-gray-700" />
          <div className="flex-1 space-y-2 py-1">
            <div className="h-3 bg-gray-700 rounded w-3/5" />
            <div className="h-2 bg-gray-700 rounded w-1/3" />
          </div>
        </div>
      ))}
    </div>
  );
};

export default Skeleton;
