using System;
using System.ComponentModel.DataAnnotations;
using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace t5_back.Models;

public class Member
{
    [Key]
    public Guid UUID { get; set; }
    
    [Required]
    [MaxLength(255)]
    public string Name { get; set; } = string.Empty;
    
    [Required]
    [MaxLength(255)]
    public string FirstName { get; set; } = string.Empty;
    
    [JsonIgnore]
    public ICollection<TeamMember>? TeamMembers { get; set; }
}
