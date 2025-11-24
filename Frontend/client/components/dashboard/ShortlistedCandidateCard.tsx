interface ShortlistedCandidateCardProps {
  name: string;
  role: string;
  score: number;
  avatar: string;
}

export default function ShortlistedCandidateCard({
  name,
  role,
  score,
  avatar,
}: ShortlistedCandidateCardProps) {
  return (
    <div className="bg-gray-100 rounded-2xl p-6 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <img
          src={avatar}
          alt={name}
          className="w-16 h-16 rounded-full object-cover"
        />
        <div>
          <h4 className="text-lg font-semibold text-merit-dark">{name}</h4>
          <p className="text-merit-gray text-sm">{role}</p>
        </div>
      </div>
      
      {/* AI Score */}
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 bg-merit-dark rounded-full"></div>
        <span className="text-2xl font-semibold text-merit-dark">{score}</span>
      </div>
    </div>
  );
}
