using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace t5_back.Models;

public class TeamUser
{
    [Required]
    public Guid TeamId { get; set; }
    
    [Required]
    public Guid UserId { get; set; }
    
    [Required]
    public Guid MemberId { get; set; }
    
    [ForeignKey("TeamId")]
    public Team? Team { get; set; }
    
    [ForeignKey("UserId")]
    public User? User { get; set; }
    
    [ForeignKey("MemberId")]
    public Member? Member { get; set; }
}
