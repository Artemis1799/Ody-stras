using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace t5_back.Models;

public class TeamMember
{
    [Required]
    public Guid TeamId { get; set; }
    
    [Required]
    public Guid MemberId { get; set; }
    
    [ForeignKey("TeamId")]
    [NotMapped]
    [JsonIgnore]
    public Team? Team { get; set; }
    
    [ForeignKey("MemberId")]
    [NotMapped]
    [JsonIgnore]
    public Member? Member { get; set; }
}
